import { useState, useEffect } from 'react';

const useContextMenu = () => {
    const [menuState, setMenuState] = useState({
        visible: false,
        position: { x: 0, y: 0 },
        options: [],
        onOptionClick: null,
    });

    const showContextMenu = (position, options, onOptionClick) => {
        setMenuState({ visible: true, position, options, onOptionClick });
    };

    const hideContextMenu = () => {
        setMenuState(prevState => ({ ...prevState, visible: false }));
    };

    useEffect(() => {
        const handleClickOutside = () => {
            hideContextMenu();
        };

        if (menuState.visible) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [menuState.visible]);

    return {
        menuState,
        showContextMenu,
        hideContextMenu,
    };
};

export default useContextMenu;
