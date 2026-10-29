export const isReplyImagePreview = (fileType?: string, url?: string): boolean => {
  if (fileType?.startsWith('image/')) return true;
  if (!url) return false;
  return /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(url);
};
