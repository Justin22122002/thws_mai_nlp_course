import joblib
import numpy as np
from scipy import spatial

EMBEDDING_DIM = 200 # size of the word embeddings - comes into various sizes 50, 100 or 200
LATENT_DIM = 200 # the size of the hidden state/vector
MAX_SEQ_LEN = 12

def load_poem_generator(path="poem_generator.pkl"):
    data = joblib.load(path)
    return (
        data["Encoder"],
        data["Decoder"],
        data["tokenizer"],
        data["word2idx"],
        data["idx2word"],
        data["word2vec"],
    )


def get_sample_line(context, Decoder, word2idx, idx2word):
    """
        Get a single line using the provided context as a hidden state

        Parameters:
            context (np.array): generated context of the same size as the word_embedding
    """

    sos_token = np.array([[word2idx.get("<sos>")]])

    h = np.array([context])
    c = np.zeros(shape=(1, LATENT_DIM))

    eos_token = word2idx['<eos>']

    output_sequence = []

    for i in range(MAX_SEQ_LEN):
        o, h, c = Decoder.predict([sos_token, h, c])

        probs = o[0, 0]

        if np.argmax(probs) == 0:
            print("Something went wrong!!")

        probs = np.nan_to_num(probs)
        probs[0] = 0

        probs /= probs.sum()

        selected_idx = np.random.choice(len(probs), p=probs)

        if selected_idx == eos_token:
            break

        output_sequence.append(idx2word.get(selected_idx, "Error <%d>" % selected_idx))

        sos_token[0][0] = selected_idx

    return output_sequence

def get_context_multiple_words(sequences, query_words, word2vec):
    if isinstance(query_words, str):
        query_words = [query_words]

    valid_words = [w for w in query_words if w in word2vec]
    if not valid_words:
        raise ValueError("Keines der query_words ist im Vokabular enthalten.")

    query_embeds = [word2vec[w] for w in valid_words]
    query_word_embed = np.mean(query_embeds, axis=0)

    if not sequences:
        return query_word_embed

    seq_embeddings = []
    for seq in sequences:
        zero_vector = np.zeros(shape=(EMBEDDING_DIM))
        for word in seq:
            zero_vector += word2vec.get(word, np.zeros(shape=(EMBEDDING_DIM)))
        seq_embeddings.append(zero_vector)
    seq_embeddings = np.array(seq_embeddings)

    weights = []
    for seq_embed in seq_embeddings:
        dist = spatial.distance.cosine(seq_embed, query_word_embed)
        weights.append(np.array([dist]))

    weights = np.array(weights / max(weights))

    context = sum(weights * seq_embeddings)

    return context

def main() -> None:
    Encoder, Decoder, tokenizer, word2idx, idx2word, word2vec = load_poem_generator()

    print("Encoder:", type(Encoder))
    print("Decoder:", type(Decoder))
    print("Tokenizer loaded.")
    print("Vocabulary size:", len(word2idx))

    query_words = ["love", "heart", "dream"]

    poem_lines = []
    sequences = []

    for line_no in range(8):
        context = get_context_multiple_words(sequences, query_words, word2vec)
        try:
            sequences.append(get_sample_line(context, Decoder, word2idx, idx2word))
        except Exception as e:
            print("Fehler beim Generieren einer Zeile:", e)
            continue
        poem_lines.append(" ".join(sequences[-1]))

    print("\n".join(poem_lines))


if __name__ == '__main__':
    main()

