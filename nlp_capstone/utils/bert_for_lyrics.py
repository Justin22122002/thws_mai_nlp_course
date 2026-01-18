from dataclasses import dataclass
from pathlib import Path

import torch
import torch.nn as nn
from torch.nn import Dropout, Linear

from transformers import (
    BertModel,
    BertTokenizer,
    DistilBertModel,
    DistilBertTokenizer,
    XLMRobertaModel,
    XLMRobertaTokenizer,
    PreTrainedTokenizerBase,
    PreTrainedModel,
)
from transformers.modeling_outputs import BaseModelOutputWithPoolingAndCrossAttentions


@dataclass
class BertForLyricsConfig:
    num_labels: int
    model_name: str
    chunk_size: int
    stride: int  # overlab between the chunks
    use_max_pooling: bool = True

type TokenizerType = BertTokenizer | DistilBertTokenizer | XLMRobertaTokenizer | PreTrainedTokenizerBase
type ModelType = BertModel | DistilBertModel | XLMRobertaModel | PreTrainedModel

# todo: pretraining on other song labels
class BertForLyrics(nn.Module):
    def __init__(
            self,
            config: BertForLyricsConfig,
            device: torch.device,
    ):
        super().__init__()
        self.device: torch.device = device
        self.tokenizer: TokenizerType
        self.bert: ModelType
        self.dropout: Dropout = nn.Dropout(0.3)
        self.classifier: Linear
        self.config: BertForLyricsConfig = config

        match self.config.model_name:
            case "distilbert-base-multilingual-cased":
                self.bert = DistilBertModel.from_pretrained(self.config.model_name)
                self.tokenizer = DistilBertTokenizer.from_pretrained(self.config.model_name)
            case " bert-base-multilingual-cased":
                self.bert = BertModel.from_pretrained(self.config.model_name)
                self.tokenizer = BertTokenizer.from_pretrained(self.config.model_name)
            case "xlm-roberta-base" | "xlm-roberta-large":
                self.bert = XLMRobertaModel.from_pretrained(self.config.model_name)
                self.tokenizer = XLMRobertaTokenizer.from_pretrained(self.config.model_name)
            case _:
                raise ModuleNotFoundError(f"model name {self.config.model_name} is not supported")

        hidden_size: int = self.bert.config.hidden_size # most time 768
        self.classifier = nn.Linear(hidden_size, self.config.num_labels)

    def forward(self, texts: list[str]) -> tuple[torch.Tensor, torch.Tensor]:
        all_embeddings: list[torch.Tensor] = []

        if self.config.chunk_size > self.tokenizer.model_max_length - 2:  # -2 cause of the [CLS] and [SEP] token
            raise ValueError(f"chunk size {self.config.chunk_size} is too large")

        for text in texts:
            tokens: list[str] = self.tokenizer.tokenize(text)
            input_ids: list[int] = self.tokenizer.convert_tokens_to_ids(tokens)

            chunk_embeddings: list[torch.Tensor] = []

            for start in range(0, len(input_ids), self.config.stride):
                chunk_ids: list[int] = input_ids[start:start + self.config.chunk_size]

                if len(chunk_ids) == 0:
                    continue

                chunk_ids = (
                        [self.tokenizer.cls_token_id]
                        + chunk_ids
                        + [self.tokenizer.sep_token_id]
                )

                attention_mask: list[int] = [1] * len(chunk_ids)

                chunk_ids: torch.Tensor = (
                    torch.tensor(chunk_ids)
                    .unsqueeze(0)
                    .to(self.device)
                )
                attention_mask: torch.Tensor = (
                    torch.tensor(attention_mask)
                    .unsqueeze(0).
                    to(self.device)
                )

                outputs: BaseModelOutputWithPoolingAndCrossAttentions = self.bert( # BaseModelOutputWithPoolingAndCrossAttentions is just the type for the xlm-roberta output
                    input_ids=chunk_ids,
                    attention_mask=attention_mask
                )

                cls: torch.Tensor = outputs.last_hidden_state[:, 0, :]
                chunk_embeddings.append(cls)

            chunk_embeddings: torch.Tensor = torch.cat(chunk_embeddings, dim=0)

            # max pooling or mean pooling over all chunks --> song_embedding = chunk_embeddings.mean(dim=0)
            if self.config.use_max_pooling:
                song_embedding: torch.Tensor = torch.max(chunk_embeddings, dim=0).values
            else:
                song_embedding: torch.Tensor = chunk_embeddings.mean(dim=0)

            all_embeddings.append(song_embedding)

        # (batch_size, hidden_size)
        embeddings: torch.Tensor = torch.stack(all_embeddings)
        # (batch_size, num_labels)
        logits: torch.Tensor = self.classifier(self.dropout(embeddings))
        return logits, embeddings

    def save_model(self, path: Path | str) -> None:
        save_dir: Path = path / self.config.model_name
        save_dir.mkdir(parents=True, exist_ok=True)

        # HuggingFace model + tokenizer
        self.bert.save_pretrained(save_dir)
        self.tokenizer.save_pretrained(save_dir)

        # optional: classifier-Head
        torch.save(
            self.classifier.state_dict(),
            save_dir / "classifier.pt"
        )
        print(f"Model saved to {save_dir}")

    @classmethod
    def load_model(
            cls,
            path: Path | str,
            config: BertForLyricsConfig,
            device: torch.device,
    ) -> 'BertForLyrics':

        if not path.exists():
            raise FileNotFoundError(f"Model directory {path} does not exist")

        model = cls(
            config=config,
            device=device,
        )

        # load backbone
        model.bert = model.bert.from_pretrained(path)

        # load tokenizer
        model.tokenizer = model.tokenizer.from_pretrained(path)

        # load classifier
        classifier_path: Path = path / "classifier.pt"
        if classifier_path.exists():
            model.classifier.load_state_dict(
                torch.load(classifier_path, map_location=device)
            )
            print("Classifier loaded successfully.")
        else:
            hidden_size = model.bert.config.hidden_size
            model.classifier = nn.Linear(hidden_size, config.num_labels).to(device)
            print("Warning: classifier.pt not found. Classifier initialized randomly!")

        model.to(device)

        print(f"Model loaded from {path}")
        return model