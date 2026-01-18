import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import random
import matplotlib.pyplot as plt
from pandas import DataFrame
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from torch.nn.modules.loss import _Loss

from torch.utils.data import DataLoader
import torch.nn as nn
from torch.optim import AdamW, Optimizer

from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.manifold import TSNE

from utils.bert_for_lyrics import BertForLyrics, BertForLyricsConfig
from utils.lyrics_dataset import LyricsDataset

# Config
# xlm-roberta-base, distilbert-base-multilingual-cased, bert-base-multilingual-cased, xlm-roberta-large (too large to train)
MODEL_NAME: str = "xlm-roberta-base"
MAX_LEN: int = 256
BATCH_SIZE: int = 8 # 4 --> unstable training, when the batch size is too small and the learning rate too large, then one batch has a huge influence on the training and can lead to unstable training
EPOCHS: int = 12
LR: float = 2e-5

LABELS: list[str] = [
    "selfdetermination",
    "heartbroken",
    "aggressive",
    "loneliness",
    "lovemaking",
    "perseverance",
    "party"
]

device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Utils
def accuracy(logits: torch.Tensor, labels: torch.Tensor) -> float:
    preds = torch.argmax(logits, dim=1)
    return (preds == labels).float().mean().item()

def set_seed(seed: int = 42) -> None:
    print(f"Random Seed: {seed}")

    random.seed(seed)  # Python
    np.random.seed(seed)  # NumPy
    torch.manual_seed(seed)  # PyTorch CPU
    torch.cuda.manual_seed(seed)  # PyTorch GPU
    torch.cuda.manual_seed_all(seed)

    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

def evaluate(
    model: nn.Module,
    dataloader: DataLoader,
    loss_fn: nn.Module,
    device: torch.device
) -> tuple[float, float]:
    model.eval()
    total_loss: float = 0.0
    total_acc: float = 0.0

    with torch.no_grad():
        for batch in dataloader:
            logits, _ = model(batch["text"])
            labels: torch.Tensor = batch["label"].to(device)

            loss: torch.Tensor = loss_fn(logits, labels)

            total_loss += loss.item()
            total_acc += accuracy(logits, labels)

    return (
        total_loss / len(dataloader),
        total_acc / len(dataloader)
    )

# Main
def main() -> None:
    use_dapt_model: bool = False
    use_separate_learning_rate_for_bert_and_cl: bool = False
    dapt_model_path: Path = Path(f"models/dapt_10_epoch")
    save_model_path: Path = Path(f"models/xlm-roberta-base_new_2")

    print("Device:", device)
    csv_dir: Path = Path("song_labels/processed")

    csv_files: list[Path] = list(csv_dir.glob("*.csv"))
    if not csv_files:
        raise RuntimeError(f"No CSV files found in {csv_dir}")

    dfs: list[DataFrame] = [
        pd.read_csv(csv_file)
        for csv_file in csv_files
    ]

    df: DataFrame = pd.concat(dfs, ignore_index=True)

    df: DataFrame = df[
        (df["lyrics_available"] == True) &
        (df["lyrics_length"] > 500)
    ][["lyrics", "Classname"]]

    # drop duplicates
    df = df.drop_duplicates(subset=["lyrics"]).reset_index(drop=True)

    print(len(df))

    label2id: dict[str, int] = {l: i for i, l in enumerate(LABELS)}
    id2label: dict[int, str] = {i: l for l, i in label2id.items()}
    df["label"] = df["Classname"].map(label2id)
    df = df.dropna()

    X_train, X_val, y_train, y_val = train_test_split(
        df["lyrics"],
        df["label"],
        test_size=0.2,
        stratify=df["label"],
        random_state=42
    )

    train_ds: LyricsDataset = LyricsDataset(X_train, y_train)
    val_ds: LyricsDataset = LyricsDataset(X_val, y_val)

    train_loader: DataLoader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader: DataLoader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

    model_config: BertForLyricsConfig = BertForLyricsConfig(
        model_name=MODEL_NAME,
        num_labels=len(LABELS),
        chunk_size=510,
        stride=256,
        use_max_pooling=True
    )

    model: BertForLyrics

    if use_dapt_model:
        model = BertForLyrics.load_model(
            path=dapt_model_path,
            config=model_config,
            device=device,
        ).to(device)
    else:
        model: BertForLyrics = BertForLyrics(
            config=model_config,
            device=device,
        ).to(device)

    optimizer: Optimizer | AdamW
    if use_separate_learning_rate_for_bert_and_cl:
        # when the training is too unstable then a smaller learning rate for the encoder is relevant
        # also warming up steps for the encoder can be sufficient
        optimizer = AdamW(
            [
                {"params": model.bert.parameters(), "lr": 5e-6},
                {"params": model.classifier.parameters(), "lr": 2e-4},
            ]
        )
    else:
        optimizer = AdamW(model.parameters(), lr=LR)

    class_weights: np.ndarray = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(y_train),
        y=y_train
    )
    loss_fn: _Loss = nn.CrossEntropyLoss(
        weight=torch.tensor(class_weights, dtype=torch.float).to(device)
    )

    metrics: dict[str, dict[str, list[float]]] = {
        "train": {
            "loss": [],
            "acc": [],
        },
        "val": {
            "loss": [],
            "acc": [],
        }
    }

    # Training
    # todo: only save the best model depending on the best validation loss
    for epoch in range(EPOCHS):
        model.train()
        total_loss: float = 0.0
        total_acc: float = 0.0

        for batch in train_loader:
            optimizer.zero_grad()

            logits, _ = model(batch["text"])
            labels: torch.Tensor = batch["label"].to(device)

            loss: torch.Tensor = loss_fn(logits, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            total_acc += accuracy(logits, labels)

        train_loss: float = total_loss / len(train_loader)
        train_acc: float = total_acc / len(train_loader)

        val_loss, val_acc = evaluate(
            model=model,
            dataloader=val_loader,
            loss_fn=loss_fn,
            device=device
        )

        metrics["train"]["loss"].append(train_loss)
        metrics["train"]["acc"].append(train_acc)
        metrics["val"]["loss"].append(val_loss)
        metrics["val"]["acc"].append(val_acc)

        print(
            f"Epoch {epoch+1:02d} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Train Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Val Acc: {val_acc:.4f}"
        )


    # safe the model
    model.save_model(save_model_path)
    print(f"Model saved to {save_model_path}")

    # save metrics
    metrics_path = save_model_path / "metrics.pkl"
    metrics_path.parent.mkdir(parents=True, exist_ok=True)

    with open(metrics_path, "wb") as f:
        pickle.dump(metrics, f)

    print(f"Metrics saved to {metrics_path}")

    # Validation + t-SNE
    model.eval()
    embeddings = []
    embed_labels = []
    val_loss = 0.0
    val_acc = 0.0
    steps = 0
    real_labels = [val_ds[i]["label"].item() for i in range(len(val_ds))]

    with torch.no_grad():
        for batch in val_ds:
            texts = [batch["text"]]
            labels = batch["label"].unsqueeze(0).to(device)

            logits, emb = model(texts)

            loss = loss_fn(logits, labels)

            val_loss += loss.item()
            val_acc += accuracy(logits, labels)
            steps += 1

            embeddings.append(emb.cpu().numpy())
            embed_labels.extend(labels.cpu().numpy())

    print(f"Validation Loss: {val_loss / steps:.4f}")
    print(f"Validation Accuracy: {val_acc / steps:.4f}")

    # here the classes from the data set are taken not the model predictions
    X_2d = TSNE(
        n_components=2,
        perplexity=30,
        random_state=42
    ).fit_transform(np.vstack(embeddings))

    plt.figure(figsize=(10, 8))
    plt.scatter(X_2d[:, 0], X_2d[:, 1], c=real_labels, cmap="tab10", alpha=0.7) # embed_labels
    plt.title("t-SNE – Full Song (Sliding Window + Max Pool)")
    plt.show()

    model.eval()
    train_embeddings = []
    train_labels = []

    with torch.no_grad():
        for batch in train_ds:
            texts = [batch["text"]]
            labels = batch["label"].unsqueeze(0).to(device)

            _, emb = model(texts)

            train_embeddings.append(emb.cpu().numpy())
            train_labels.extend(labels.cpu().numpy())

    X_train_2d = TSNE(n_components=2, perplexity=30, random_state=42).fit_transform(
        np.vstack(train_embeddings)
    )

    plt.figure(figsize=(10, 8))
    plt.scatter(X_train_2d[:, 0], X_train_2d[:, 1], c=train_labels, cmap="tab10", alpha=0.7)
    plt.title("t-SNE – Training Set (Full Song, Sliding Window + Max Pool)")
    plt.show()


    # training plots for train and validation
    plt.figure(figsize=(12, 4))

    # Loss
    plt.subplot(1, 2, 1)
    plt.plot(metrics["train"]["loss"], label="Train")
    plt.plot(metrics["val"]["loss"], label="Val")
    plt.title("Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()

    # Accuracy
    plt.subplot(1, 2, 2)
    plt.plot(metrics["train"]["acc"], label="Train")
    plt.plot(metrics["val"]["acc"], label="Val")
    plt.title("Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()

    plt.tight_layout()
    plt.show()

    plot_confusion_matrix(
        model=model,
        dataset=train_ds,
        label_names=LABELS,
        device=device,
        title="Confusion Matrix – Train Set"
    )

    plot_confusion_matrix(
        model=model,
        dataset=val_ds,
        label_names=LABELS,
        device=device,
        title="Confusion Matrix – Validation Set"
    )

def plot_confusion_matrix(
    model: nn.Module,
    dataset: LyricsDataset,
    label_names: list[str],
    device: torch.device,
    title: str
):
    model.eval()
    y_true = []
    y_pred = []

    with torch.no_grad():
        for batch in dataset:
            texts = [batch["text"]]
            label = batch["label"].item()

            logits, _ = model(texts)
            pred = torch.argmax(logits, dim=1).item()

            y_true.append(label)
            y_pred.append(pred)

    cm = confusion_matrix(y_true, y_pred)

    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=label_names
    )

    disp.plot(cmap="Blues", xticks_rotation=45)
    plt.title(title)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    set_seed()
    main()
