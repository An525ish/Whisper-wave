import Table from '@/components/ui/tables/Table';
import Searchbar from '@/components/ui/Searchbar';
import Image from '@/components/ui/Image';
import { useAdminUsersQuery } from '@/hooks/admin';
import { useMemo, useState, type ReactNode } from 'react';
import type { AdminUserRow } from '@/types/admin';

const Users = () => {
  const { data, isLoading } = useAdminUsersQuery();
  const [searchText, setSearchText] = useState('');

  const users: AdminUserRow[] =
    (data as { users?: AdminUserRow[] } | undefined)?.users ?? [];

  const tableData = useMemo((): ReactNode[][] => {
    const filtered = users.filter((user) => {
      const q = searchText.toLowerCase();
      if (!q) return true;
      return (
        user.name?.toLowerCase().includes(q) ||
        user.username?.toLowerCase().includes(q) ||
        String(user._id).toLowerCase().includes(q)
      );
    });

    return filtered.map((user) => [
      <p key={`${user._id}-id`} className="text-center truncate max-w-40">
        {user._id}
      </p>,
      <div
        key={`${user._id}-name`}
        className="flex items-center justify-center gap-2 text-left"
      >
          <div className="w-8 h-8 rounded-sm overflow-hidden bg-primary">
          <Image src={user.avatar?.url} alt="" className="h-full w-full" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium">{user.name}</p>
        </div>
      </div>,
      <p key={`${user._id}-username`}>@{user.username}</p>,
      <p key={`${user._id}-created`}>
        {user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : '—'}
      </p>,
    ]);
  }, [users, searchText]);

  return (
    <div>
      <p className="font-medium border-b full-border w-fit text-2xl mx-auto px-12 py-2 mb-12">
        Users Status
      </p>

      <div className="w-full px-12 mb-8">
        <Searchbar
          className={'w-72 mx-auto '}
          searchText={searchText}
          setSearchText={setSearchText}
          expandable={false}
        />
      </div>

      {isLoading ? (
        <p className="text-center text-body-300">Loading users…</p>
      ) : (
        <Table
          header={['User Id', 'Name', 'Username', 'Joined'] as never[]}
          content={tableData as never[][]}
          fixed={false}
        />
      )}
    </div>
  );
};

export default Users;
