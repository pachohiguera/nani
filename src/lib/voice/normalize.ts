// Minúsculas + sin acentos, para que "Pipí"/"pipi" o "Terminé"/"termine"
// sean equivalentes al comparar transcripciones de voz.
export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
