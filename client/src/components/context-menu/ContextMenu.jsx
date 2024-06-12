
const ContextMenu = ({ menuState, hideContextMenu }) => {
    if (!menuState.visible) return null;

    return (
        <div
            className="absolute z-50 bg-primary border border-border rounded shadow-lg"
            style={{ top: menuState.position.y, left: menuState.position.x }}
        >
            <ul className="w-max">
                {menuState.options.map((option) => (
                    <li
                        key={option.id}
                        className="px-4 py-2 hover:bg-gray-200 text-body-700 border-0 border-b full-border cursor-pointer hover:bg-gradient-dark-black transition"
                        onClick={() => {
                            menuState.onOptionClick(option);
                            hideContextMenu();
                        }}
                    >
                        <img className="w-5 h-5 inline-block mr-2" src={option.icon} alt="" />
                        {option.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ContextMenu;
