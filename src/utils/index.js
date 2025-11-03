/**
 * ページURLを生成するユーティリティ
 */
export function createPageUrl(pageName) {
  // ページ名をケバブケースに変換
  const kebabCase = pageName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `/${kebabCase}`;
}

/**
 * クラス名を結合するユーティリティ
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
