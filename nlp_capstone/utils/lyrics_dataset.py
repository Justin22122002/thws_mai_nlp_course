import torch
from torch.utils.data import Dataset


# Dataset (RAW TEXT)
class LyricsDataset(Dataset):
    def __init__(self, texts, labels):
        self.texts = texts.tolist()
        self.labels = labels.tolist()

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "text": self.texts[idx],
            "label": torch.tensor(self.labels[idx], dtype=torch.long)
        }