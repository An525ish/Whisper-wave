import { createContext, useState } from "react"
import ThreeDotsIcon from "../icons/ThreeDots"
import LeaveGroupIcon from "../icons/LeaveGroup"

export const SidebarContext = createContext()

const Sidebar = ({ children }) => {
    const [expanded, setExpanded] = useState(true)
    const [isDotsMenuActive, setIsDotsMenuActive] = useState(false)

    const handleLogout = () => {
        console.log('first')
    }

    return (
        <aside className="h-screen">
            <nav className="h-full flex flex-col border-r border-border shadow-sm">
                <div className="p-4 pb-2 flex justify-between items-center mb-4">
                    <img
                        src="https://img.logoipsum.com/243.svg"
                        className={`overflow-hidden transition-all ${expanded ? "w-32" : "w-0"
                            }`}
                        alt=""
                    />
                    <button
                        onClick={() => setExpanded((curr) => !curr)}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                        {
                            expanded ?
                                <img src="/icons/angle-right-icon.svg" alt="chevron" className="w-4 -scale-x-[1]" /> : <img src="/icons/angle-right-icon.svg" alt="chevron" className="w-4" />
                        }
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3">{children}</ul>
                </SidebarContext.Provider>

                <div className="relative border-t border-border flex p-3">
                    <img
                        src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
                        alt=""
                        className="w-10 h-10 rounded-md"
                    />
                    <div
                        className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}
                    >
                        <div className="leading-4">
                            <h4 className="font-semibold">John Doe</h4>
                            <span className="text-xs text-gray-600">johndoe@gmail.com</span>
                        </div>

                        <ThreeDotsIcon
                            className={'h-4 hover:fill-body-700 cursor-pointer'}
                            onClick={() => setIsDotsMenuActive(prev => !prev)}
                        />

                        {
                            isDotsMenuActive &&
                            <div className="absolute bg-primary p-2 rounded-md list-none -right-16 bottom-8">
                                <li
                                    className="hover:text-red group transition cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LeaveGroupIcon className={'w-3 inline-block mr-2 group-hover:fill-red'} /> Logout
                                </li>
                            </div>
                        }
                    </div>
                </div>
            </nav>
        </aside>
    )
}

export default Sidebar