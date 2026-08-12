import { Helmet } from 'react-helmet-async';
import { useNotificationsStore } from '@/stores/notifications';
import { formatUnreadCount } from '@/utils/unread';

type TitleProps = {
  title?: string;
  desc?: string;
};

const Title = ({
  title = 'Whisper Wave',
  desc = 'This is a real time chat app',
}: TitleProps) => {
  const unread = useNotificationsStore((s) => s.messageNotificationCount);
  const pageTitle =
    unread > 0 ? `(${formatUnreadCount(unread)}) ${title}` : title;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
    </Helmet>
  );
};

export default Title;
