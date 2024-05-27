import pdfIcon from '../../assets/doc-Icons/pdf.svg'
import docIcon from '../../assets/doc-Icons/doc.svg'
import pptIcon from '../../assets/doc-Icons/ppt.svg'
import csvIcon from '../../assets/doc-Icons/csv.svg'
import xlsIcon from '../../assets/doc-Icons/xls.svg'
import zipIcon from '../../assets/doc-Icons/zip.svg'
import txtIcon from '../../assets/doc-Icons/txt.svg'
import defaultIcon from '../../assets/doc-Icons/default.svg'
import Carousel from '@/components/ui/carousel/Carousel'

const fileData = [
    {
        id: 2,
        icon: pdfIcon,
        docType: "PDF",
        docName: "github notes.pdf"
    },
    {
        id: 3,
        icon: docIcon,
        docType: "DOC",
        docName: "react notes.doc"
    },
    {
        id: 4,
        icon: xlsIcon,
        docType: "XLS",
        docName: "node js notes.xls"
    },
    {
        id: 5,
        icon: txtIcon,
        docType: "TXT",
        docName: "express js notes.txt"
    },
    {
        id: 6,
        icon: pptIcon,
        docType: "PPT",
        docName: "css notes notes.ppt"
    },
    {
        id: 7,
        icon: zipIcon,
        docType: "ZIP",
        docName: "html notes.zip"
    },
    {
        id: 8,
        icon: csvIcon,
        docType: "CSV",
        docName: "mongo db notes.csv"
    },
    {
        id: 1,
        icon: defaultIcon,
        docType: "Document",
        docName: "web dev notes.unknown"
    },
];



const ProfilePanel = () => {
    return (
        <div className="relative bg-background-alt rounded-2xl mt-16 h-[78vh] py-2">
            <div className="w-24 h-24 rounded-full bg-primary absolute -top-14 left-1/2 -translate-x-1/2 overflow-hidden z-10 border-8 border-background">
                <img src="https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250" alt="" className="object-cover" />
            </div>

            <p className="text-center text-xl font-medium mt-10">Name</p>

            <div className='overflow-y-auto scrollbar-hide h-[65vh]'>
                {true && <div className='p-4 flex gap-4 h-[12rem]'>
                    <div className='flex-[1]'>
                        <img src="https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250" alt="" className='object-fill w-28 h-28 rounded-full bg-background-alt border-2 border-white' />
                        <p className='font-medium text-center text-lg capitalize mt-2 text-body'>John Doe</p>
                        <p className='text-xs text-center text-body-700 border-0 border-b full-border pb-1 tracking-widest'>Creator</p>
                    </div>

                    <div className=''>
                        <Carousel className={'w-[12rem] h-full'} />
                    </div>
                </div>}

                <div className="mt-4 pl-2 pr-1">
                    <p className="px-2 text-body-700 capitalize border-0 border-b half-border pb-1">Photos & Multimedia</p>
                    <div className="flex gap-4 flex-wrap my-4 overflow-y-auto scrollbar-custom h-[11rem]">
                        {Array(9).fill(0).map((img) => <img key={img} src="https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250" alt="" className="w-[30%] h-20 bg-primary rounded-lg object-cover cursor-pointer hover:opacity-50 transition-opacity" />)}
                    </div>
                    <p className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer">View More</p>
                </div>

                <div className="px-4 mt-4">
                    <p className="px-2 text-body-700 capitalize border-0 border-b half-border pb-1">Attachments</p>
                    <div className="flex flex-wrap my-4 gap-2 overflow-y-scroll scrollbar-custom h-[7rem]">
                        {fileData.map((file) =>
                            <div key={file.id} className="w-full h-8 rounded-lg">
                                <p className="flex gap-4 items-center h-full w-[90%] cursor-pointer"><img src={file.icon} alt={file.docName} className="w-6" /><span className='capitalize text-sm'>{file.docName}</span></p>
                            </div>
                        )}
                    </div>
                    <p className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer">View More</p>
                </div>
            </div>
        </div >
    )
}

export default ProfilePanel