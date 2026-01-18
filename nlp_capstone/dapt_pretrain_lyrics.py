import math
import pickle
from pathlib import Path

import kagglehub
import pandas as pd
from pandas import DataFrame
from sklearn.model_selection import train_test_split
from tqdm import tqdm
from transformers import XLMRobertaTokenizer, PreTrainedTokenizerBase
import torch
from torch.optim import AdamW
from torch.utils.data import Dataset, DataLoader

from transformers import (
    XLMRobertaForMaskedLM,
    DataCollatorForLanguageModeling,
)


class LyricsMLMDataset(Dataset):
    def __init__(
        self,
        lyrics: list[str],
        tokenizer: PreTrainedTokenizerBase,
        max_length: int,
    ):
        self.lyrics: list[str] = lyrics
        self.tokenizer: PreTrainedTokenizerBase = tokenizer
        self.max_length: int = max_length

    def __len__(self) -> int:
        return len(self.lyrics)

    def __getitem__(self, idx: int) -> dict:
        encoding = self.tokenizer(
            self.lyrics[idx],
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
        }

def evaluate_mlm(
    model: XLMRobertaForMaskedLM,
    dataloader: DataLoader,
    device: torch.device,
) -> tuple[float, float, float ]:
    model.eval()

    total_loss = 0.0
    total_correct = 0
    total_masked = 0

    with torch.no_grad():
        for batch in dataloader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)

            loss = outputs.loss
            logits = outputs.logits
            labels = batch["labels"]

            total_loss += loss.item()

            predictions = torch.argmax(logits, dim=-1)
            mask = labels != -100

            total_correct += (predictions[mask] == labels[mask]).sum().item()
            total_masked += mask.sum().item()

    avg_loss = total_loss / len(dataloader)
    perplexity = math.exp(avg_loss)
    masked_acc = total_correct / total_masked if total_masked > 0 else 0.0

    return perplexity, masked_acc, avg_loss

def train_dapt_with_config(
    lyrics: list[str],
    model_name: str,
    output_dir: Path,
    device: torch.device,
    epochs: int = 3,
    batch_size: int = 8,
    lr: float = 5e-5,
    mlm_probability: float = 0.15,
):

    mlm_model = XLMRobertaForMaskedLM.from_pretrained(
        model_name
    )
    tokenizer = mlm_model.get_input_embeddings().weight.device
    tokenizer = None

    tokenizer = XLMRobertaTokenizer.from_pretrained(model_name)

    mlm_model.to(device)
    mlm_model.train()

    lyrics_train, lyrics_val = train_test_split(
        lyrics,
        test_size=0.1,
        random_state=42
    )

    print(f"Train lyrics: {len(lyrics_train)}")
    print(f"Val lyrics:   {len(lyrics_val)}")

    train_dataset: LyricsMLMDataset = LyricsMLMDataset(
        lyrics=lyrics_train,
        tokenizer=tokenizer,
        max_length=mlm_model.config.max_position_embeddings - 2,
    )

    val_dataset: LyricsMLMDataset = LyricsMLMDataset(
        lyrics=lyrics_val,
        tokenizer=tokenizer,
        max_length=mlm_model.config.max_position_embeddings - 2,
    )

    data_collator: DataCollatorForLanguageModeling = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=True, # Masked Language Modeling
        mlm_probability=mlm_probability, # percentage of token erasing for masked language modeling
    )

    train_loader: DataLoader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=data_collator,
    )

    val_loader: DataLoader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=data_collator,
    )

    optimizer: AdamW = AdamW(mlm_model.parameters(), lr=lr)

    metrics: dict[str, dict[str, list[float]]] = {
        "train": {
            "loss": [],
            "perplexity": [],
            "masked_acc": [],
        },
        "val": {
            "loss": [],
            "perplexity": [],
            "masked_acc": [],
        }
    }

    for epoch in range(epochs):
        mlm_model.train()

        total_loss = 0.0
        total_correct = 0
        total_masked = 0

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}")

        for batch in progress_bar:
            batch = {k: v.to(device) for k, v in batch.items()}

            outputs = mlm_model(**batch)
            loss = outputs.loss
            logits = outputs.logits

            loss.backward()
            optimizer.step()
            optimizer.zero_grad()

            total_loss += loss.item()

            # Masked Token Accuracy
            labels = batch["labels"]
            predictions = torch.argmax(logits, dim=-1)

            mask = labels != -100
            correct = (predictions[mask] == labels[mask]).sum().item()
            masked = mask.sum().item()

            total_correct += correct
            total_masked += masked

            acc = correct / masked if masked > 0 else 0.0
            progress_bar.set_postfix(
                loss=f"{loss.item():.4f}",
                masked_acc=f"{acc:.3f}",
            )

        avg_loss = total_loss / len(train_loader)
        perplexity = math.exp(avg_loss)
        masked_accuracy = total_correct / total_masked

        val_ppl, val_acc, val_loss = evaluate_mlm(
            model=mlm_model,
            dataloader=val_loader,
            device=device,
        )

        metrics["train"]["loss"].append(avg_loss)
        metrics["train"]["perplexity"].append(perplexity)
        metrics["train"]["masked_acc"].append(masked_accuracy)

        metrics["val"]["perplexity"].append(val_ppl)
        metrics["val"]["masked_acc"].append(val_acc)
        metrics["val"]["loss"].append(val_loss)

        print(
            f"Epoch {epoch + 1} finished | "
            f"Loss: {metrics['train']['loss'][-1]:.4f} | "
            f"Perplexity: {metrics['train']['perplexity'][-1]:.2f} | "
            f"Masked Acc: {metrics['train']['masked_acc'][-1]:.3f} | "
            f"Validation Loss: {metrics['val']['loss'][-1]:.4f} | "
            f"Validation Perplexity: {metrics['val']['perplexity'][-1]:.2f} | "
            f"Validation Masked Acc: {metrics['val']['masked_acc'][-1]:.3f}"
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    mlm_model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"DAPT finished. Model saved to {output_dir}")

    metrics_path = output_dir / "metrics.pkl"
    with open(metrics_path, "wb") as f:
        pickle.dump(metrics, f)
    print(f"Metrics saved to {metrics_path}")


def main() -> None:
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    epochs: int = 10

    dataset_path = kagglehub.dataset_download("joebeachcapital/57651-spotify-songs")
    print(f"Dataset downloaded to: {dataset_path}")

    csv_file = Path(dataset_path) / "Spotify Million Song Dataset_exported.csv"

    df: DataFrame = pd.read_csv(csv_file)
    df = df[df["text"].notna() & (df["text"].str.len() > 50)]
    # here only n songs get loaded, increase if needed
    lyrics = df["text"].sample(n=2000, random_state=42).tolist()

    print(f"Loaded {len(lyrics)} lyrics")

    train_dapt_with_config(
        lyrics=lyrics,
        model_name="xlm-roberta-base",
        output_dir=Path(f"./models/dapt_{epochs}_epoch"),
        device=device,
        epochs=epochs,
        batch_size=2,
    )

if __name__ == "__main__":
    main()
