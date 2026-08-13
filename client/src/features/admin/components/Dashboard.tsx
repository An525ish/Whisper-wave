import BarChart from '@/shared/components/charts/BarChart';
import SingleAreaChart from '@/shared/components/charts/SingleAreaChart';
import AreaChart from '@/shared/components/charts/AreaChart';
import AllocationChart from '@/shared/components/charts/DoughnutChart';
import MembersIcon from '@/shared/components/icons/Members';
import CreateGroupIcon from '@/shared/components/icons/CreateGroup';
import ChatIcon from '@/shared/components/icons/Chat';
import ArrowUp from '@/shared/components/icons/ArrowUp';
import { useAdminStatsQuery } from '@/features/admin/hooks';
import type { AdminStats, IconProps } from '@/shared/types';
import type { ComponentType } from 'react';

type TitleStat = {
  title: string;
  Icon: ComponentType<IconProps>;
  value: number | string;
  online?: boolean;
};

const Dashboard = () => {
  const { data } = useAdminStatsQuery();
  const stats: AdminStats | undefined = data?.stats;

  const seriesLabels: string[] = stats?.seriesLabels ?? [];
  const newUsersSeries: number[] = stats?.newUsersSeries ?? [];
  const messagesSeries: number[] = stats?.messagesSeries ?? [];

  const weekUsers = newUsersSeries.reduce((a, b) => a + b, 0);
  const weekMessages = messagesSeries.reduce((a, b) => a + b, 0);

  const titleStats: TitleStat[] = [
    {
      title: 'Users',
      Icon: MembersIcon,
      value: stats?.users ?? '—',
    },
    {
      title: 'Groups',
      Icon: CreateGroupIcon,
      value: stats?.groups ?? '—',
    },
    {
      title: 'Online Users',
      Icon: MembersIcon,
      value: stats?.onlineUsers ?? '—',
      online: true,
    },
    {
      title: 'Chats',
      Icon: ChatIcon,
      value: stats?.chats ?? '—',
    },
  ];

  return (
    <div className="px-12 mt-4 w-full">
      <div className="flex justify-around gap-4 text-body-700">
        {titleStats.map(({ title, Icon, value, online }, i) => (
          <div
            key={i}
            className="grid place-items-center text-center bg-gradient-idea-blue  border-2 border-blue-light shadow-md w-48 h-48 p-2 rounded-full"
          >
            <div className="">
              <div className="relative">
                <Icon
                  className={'w-10 mx-auto fill-blue-light stroke-blue-light'}
                />
                {online && (
                  <div className="w-2 h-2 bg-blue absolute right-5 top-0 rounded-full animate-pulse"></div>
                )}
              </div>
              <p className="text-2xl font-semibold my-4">{value}</p>
              <p className="text font-medium">{title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex text-body-700 justify-between gap-12 mt-12">
        <div className="w-3/5 h-[20rem]">
          <p className="flex gap-4 border-b border-border pb-2 mb-4 text-xl font-semibold">
            New Users{' '}
            <span className="text-green">
              <ArrowUp className={'inline-block mr-1'} /> {weekUsers} this week
            </span>
          </p>
          <AreaChart
            labels={seriesLabels as never[]}
            values={newUsersSeries as never[]}
            label="New users"
          />
        </div>
        <div className="w-2/5 h-[20rem]">
          <p className="flex gap-4 border-b border-border pb-2 mb-4 text-xl font-semibold">
            Messages{' '}
            <span className="text-green">
              <ArrowUp className={'inline-block mr-1'} /> {weekMessages} this
              week
            </span>
          </p>
          <BarChart
            labels={seriesLabels as never[]}
            values={messagesSeries as never[]}
            label="Messages"
          />
        </div>
      </div>

      <div className="flex justify-between text-body-700 gap-14 mt-20">
        <div className="w-full ">
          <div className="flex justify-between border-b border-border mb-4  pb-2">
            <p className="font-semibold text-xl">Allocation</p>
          </div>
          <div className="">
            <AllocationChart
              labels={['Users', 'Groups', 'Chats', 'Messages'] as never[]}
              values={[
                stats?.users ?? 0,
                stats?.groups ?? 0,
                stats?.chats ?? 0,
                stats?.messages ?? 0,
              ] as never[]}
            />
          </div>
        </div>

        <div className="w-full ">
          <div className="flex justify-between border-b border-border mb-4  pb-2">
            <p className="font-semibold text-xl">Weekly Message Stats</p>
          </div>
          <div>
            <div className="mb-8 h-[10rem]">
              <SingleAreaChart
                labels={seriesLabels as never[]}
                values={messagesSeries as never[]}
                label="Messages"
              />
            </div>
            <div className="text-sm mt-4 space-y-2">
              <p className="flex justify-between">
                <span>Messages this week</span>
                <span>{weekMessages}</span>
              </p>
              <p className="flex justify-between">
                <span>New users this week</span>
                <span>{weekUsers}</span>
              </p>
              <p className="flex justify-between">
                <span>Total messages</span>
                <span>{stats?.messages ?? 0}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full ">
          <div className="flex justify-between border-b border-border mb-4 pb-2">
            <p className="font-semibold text-xl">Snapshot</p>
          </div>
          <div className="w-full space-y-4 mt-4 text-sm">
            <p className="flex justify-between border-b border-border pb-2">
              <span>Users</span>
              <span>{stats?.users ?? 0}</span>
            </p>
            <p className="flex justify-between border-b border-border pb-2">
              <span>Online now</span>
              <span>{stats?.onlineUsers ?? 0}</span>
            </p>
            <p className="flex justify-between border-b border-border pb-2">
              <span>Groups</span>
              <span>{stats?.groups ?? 0}</span>
            </p>
            <p className="flex justify-between border-b border-border pb-2">
              <span>Chats</span>
              <span>{stats?.chats ?? 0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
