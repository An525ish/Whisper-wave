import pdfIcon from '../assets/doc-Icons/pdf.svg';
import docIcon from '../assets/doc-Icons/doc.svg';
import pptIcon from '../assets/doc-Icons/ppt.svg';
import csvIcon from '../assets/doc-Icons/csv.svg';
import xlsIcon from '../assets/doc-Icons/xls.svg';
import zipIcon from '../assets/doc-Icons/zip.svg';
import txtIcon from '../assets/doc-Icons/txt.svg';
import defaultIcon from '../assets/doc-Icons/default.svg';

export const fileFormat = (url = '') => {
  const fileExtension = url.split('.').pop();

  const extensionMap = {
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    bmp: 'image',
    svg: 'image',
    mp4: 'video',
    avi: 'video',
    mov: 'video',
    wmv: 'video',
    mp3: 'audio',
    wav: 'audio',
    ogg: 'audio',
    doc: 'doc',
    docx: 'doc',
    xls: 'xls',
    xlsx: 'xls',
    pdf: 'pdf',
    txt: 'text',
    // Add more mappings as needed
  };

  return extensionMap[fileExtension.toLowerCase()] || 'unknown';
};

export const fileData = [
  {
    id: 1,
    icon: defaultIcon,
    docType: 'unknown',
  },
  {
    id: 2,
    icon: pdfIcon,
    docType: 'pdf',
  },
  {
    id: 3,
    icon: docIcon,
    docType: 'doc',
  },
  {
    id: 4,
    icon: xlsIcon,
    docType: 'xls',
  },
  {
    id: 5,
    icon: txtIcon,
    docType: 'txt',
  },
  {
    id: 6,
    icon: pptIcon,
    docType: 'ppt',
  },
  {
    id: 7,
    icon: zipIcon,
    docType: 'zip',
  },
  {
    id: 8,
    icon: csvIcon,
    docType: 'csv',
  },
];

export const transformImage = (url = '', width = 100) => {
  const newUrl = url.replace('upload/', `upload/dpr_auto/w_${width}/`);
  return newUrl;
};
