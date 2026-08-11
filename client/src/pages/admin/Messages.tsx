import Table from '@/components/tables/Table';
import Searchbar from '@/shared/Searchbar';
import Image from '@/components/ui/Image';
import { useAdminMessagesQuery } from '@/features/admin/hooks';
import { useMemo, useState, type ReactNode } from 'react';

type AdminMessageRow = {
  _id: string;
  content?: string;
  status?: string;
  createdAt?: string;
  attachments?: unknown[];
  sender?: {
    name?: string;
    username?: string;
    avatar?: { url?: string };
  };
  chat?: { name?: string };
};

const Messages = () => {
  const { data, isLoading } = useAdminMessagesQuery();
  const [searchText, setSearchText] = useState('');
  const messages: AdminMessageRow[] =
    (data as { messages?: AdminMessageRow[] } | undefined)?.messages ?? [];

  const tableData = useMemo((): ReactNode[][] => {
    const q = searchText.toLowerCase();
    return messages
      .filter((msg) => {
        if (!q) return true;
        const senderName = msg.sender?.name ?? '';
        const content = msg.content ?? '';
        return (
          senderName.toLowerCase().includes(q) ||
          content.toLowerCase().includes(q)
        );
      })
      .map((msg) => [
        <div
          key={`${msg._id}-sender`}
          className="flex items-center justify-center gap-2 text-left"
        >
          <div className="w-8 h-8 rounded-sm overflow-hidden bg-primary">
            <Image
              src={msg.sender?.avatar?.url}
              alt=""
              className="h-full w-full"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">
              {msg.sender?.name ?? 'Unknown'}
            </p>
            <p className="text-grey text-xxs">
              @{msg.sender?.username ?? '—'}
            </p>
          </div>
        </div>,
        <p key={`${msg._id}-chat`}>{msg.chat?.name ?? '—'}</p>,
        <p key={`${msg._id}-content`} className="truncate max-w-[14rem]">
          {msg.content || (msg.attachments?.length ? '[attachment]' : '—')}
        </p>,
        <p key={`${msg._id}-status`}>{msg.status ?? '—'}</p>,
        <p key={`${msg._id}-date`}>
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleString()
            : '—'}
        </p>,
      ]);
  }, [messages, searchText]);

  return (
    <div>
      <p className="font-medium border-b full-border w-fit text-2xl mx-auto px-12 py-2 mb-12">
        Messages
      </p>

      <div className="w-full px-12 mb-8">
        <Searchbar
          className={'w-[18rem] mx-auto '}
          searchText={searchText}
          setSearchText={setSearchText}
          expandable={false}
        />
      </div>

      {isLoading ? (
        <p className="text-center text-body-300">Loading messages…</p>
      ) : (
        <Table
          header={['Sender', 'Chat', 'Content', 'Status', 'Sent'] as never[]}
          content={tableData as never[][]}
          fixed={false}
        />
      )}
    </div>
  );
};

export default Messages;
