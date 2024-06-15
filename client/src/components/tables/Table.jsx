const Table = ({
    header = [],
    content = [],
    fixed = false,
}) => {
    return (
        <div className={`mb-12 w-full rounded-md`}>
            <table
                className={`w-full table ${fixed ? 'table-fixed' : 'table-auto'
                    } border-collapse overflow-auto scrollbar-hide`}
            >
                <thead className={`w-full gradient-border bg-gradient-background`}>
                    <tr className="text-center">
                        {header.map((cellHead, cellIndex) => (
                            <th className={`px-4 py-3 ${cellIndex != 0 && 'text-center'}`} key={cellIndex}>
                                {cellHead}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-base">
                    {content.map((tableRow, key) => (
                        <tr className="text-center hover:bg-gradient-background" key={key}>
                            {tableRow.map((cell, cellIndex) => {
                                return (
                                    <td
                                        key={cellIndex}
                                        className={`px-6 py-3 text-sm
                                        text-center font-medium`}
                                    >
                                        {cell}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
