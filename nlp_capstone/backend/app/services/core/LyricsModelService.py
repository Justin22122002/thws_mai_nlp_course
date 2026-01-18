from pathlib import Path
import torch
import numpy as np
from utils.bert_for_lyrics import BertForLyrics, BertForLyricsConfig


class LyricsModelService:
    """Loads the trained model and performs inference"""

    def __init__(
        self,
        model_path: Path,
        config: BertForLyricsConfig,
        device: torch.device,
        id2label: dict[int, str],
    ):
        self.device: torch.device = device
        self.id2label : dict[int, str]= id2label

        self.model: BertForLyrics = BertForLyrics.load_model(
            path=model_path,
            config=config,
            device=device,
        )
        self.model.eval()

    @torch.no_grad()
    def predict(self, lyrics: str) -> tuple[str, np.ndarray]:
        """
        Returns:
        - predicted class
        - embedding (hidden_size,)
        """
        if not lyrics:
            raise ValueError("Empty lyrics")

        logits, embedding = self.model([lyrics])

        pred_id: int = torch.argmax(logits, dim=1).item()
        pred_label: str = self.id2label[pred_id]

        return pred_label, embedding.squeeze(0).cpu().numpy()