import pickle
import matplotlib.pyplot as plt
from pathlib import Path

def plot_metrics(metrics_path: Path):
    with open(metrics_path, "rb") as f:
        metrics = pickle.load(f)

    epochs = range(1, len(metrics["train"]["loss"]) + 1)

    plt.figure(figsize=(15, 5))

    # Loss
    plt.subplot(1, 3, 1)
    plt.plot(epochs, metrics["train"]["loss"], label="Train Loss")
    plt.plot(epochs, metrics["val"]["loss"], label="Val Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()
    plt.title("Loss")

    # Perplexity
    plt.subplot(1, 3, 2)
    plt.plot(epochs, metrics["train"]["perplexity"], label="Train PPL")
    plt.plot(epochs, metrics["val"]["perplexity"], label="Val PPL")
    plt.xlabel("Epoch")
    plt.ylabel("Perplexity")
    plt.legend()
    plt.title("Perplexity")

    # Masked Accuracy
    plt.subplot(1, 3, 3)
    plt.plot(epochs, metrics["train"]["masked_acc"], label="Train Masked Acc")
    plt.plot(epochs, metrics["val"]["masked_acc"], label="Val Masked Acc")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()
    plt.title("Masked Token Accuracy")

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    plot_metrics(Path("./models/dapt_10_epoch/metrics.pkl"))
