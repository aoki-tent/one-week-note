import type { Memo, Settings } from './memo';
import { formatCreatedAt } from './memo';

export function buildSendUrl(memo: Memo, settings: Settings): string {
  const subject = `OWN: ${memo.body}`;
  const annotationBlock = memo.annotation ? `\n\n${memo.annotation}` : '';
  const formattedDate = formatCreatedAt(memo.createdAt);
  const body = `${memo.body}${annotationBlock}\n\n---\n${formattedDate} に作成\nOne Week Noteから送信`;
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: settings.email,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
