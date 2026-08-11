import Table from '@/components/tables/Table';
import Searchbar from '@/shared/Searchbar';
import Image from '@/components/ui/Image';
import { useAdminGroupsQuery } from '@/features/admin/hooks';
import { useMemo, useState, type ReactNode } from 'react';

type AdminGroupRow = {
  _id: string;
  name?: string;
  members?: unknown[];
  creator?: { name?: string };
  createdAt?: string;
};

const Groups = () => {
  const { data, isLoading } = useAdminGroupsQuery();
  const [searchText, setSearchText] = useState('');
  const groups: AdminGroupRow[] =
    (data as { groups?: AdminGroupRow[] } | undefined)?.groups ?? [];

  const tableData = useMemo((): ReactNode[][] => {
    const q = searchText.toLowerCase();
    return groups
      .filter((group) => {
        if (!q) return true;
        return (
          group.name?.toLowerCase().includes(q) ||
          String(group._id).toLowerCase().includes(q)
        );
      })
      .map((group) => [
        <p
          key={`${group._id}-id`}
          className="text-center truncate max-w-[10rem]"
        >
          {group._id}
        </p>,
        <div
          key={`${group._id}-name`}
          className="flex items-center justify-center gap-2 text-left"
        >
          <div className="w-8 h-8 rounded-sm overflow-hidden bg-primary">
            <Image src={null} alt="" className="h-full w-full" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">{group.name}</p>
          </div>
        </div>,
        <p key={`${group._id}-members`}>{group.members?.length ?? 0}</p>,
        <p key={`${group._id}-creator`}>
          {group.creator?.name ?? '—'}
        </p>,
        <p key={`${group._id}-date`}>
          {group.createdAt
            ? new Date(group.createdAt).toLocaleDateString()
            : '—'}
        </p>,
      ]);
  }, [groups, searchText]);

  return (
    <div>
      <p className="font-medium border-b full-border w-fit text-2xl mx-auto px-12 py-2 mb-12">
        Groups
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
        <p className="text-center text-body-300">Loading groups…</p>
      ) : (
        <Table
          header={['Group Id', 'Name', 'Members', 'Creator', 'Created'] as never[]}
          content={tableData as never[][]}
          fixed={false}
        />
      )}
    </div>
  );
};

export default Groups;
