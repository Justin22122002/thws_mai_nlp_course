from pathlib import Path

import torch

from utils.bert_for_lyrics import BertForLyrics, BertForLyricsConfig

MODEL_NAME: str = "xlm-roberta-base"

LABELS: list[str] = [
    "selfdetermination",
    "heartbroken",
    "aggressive",
    "loneliness",
    "lovemaking",
    "perseverance",
    "party"
]
# MODEL_PATH: Path = Path("models/xlm-roberta-base_1")
MODEL_PATH: Path = Path("models/dapt")

def main() -> None:
    model_config: BertForLyricsConfig = BertForLyricsConfig(
        model_name=MODEL_NAME,
        num_labels=len(LABELS),
        chunk_size=510,
        stride=256
    )

    model = BertForLyrics.load_model(
        path=MODEL_PATH,
        config=model_config,
        device=torch.device("cuda" if torch.cuda.is_available() else "cpu"),
    )

if __name__ == "__main__":
    main()