export const getFirstName = (fullName) => {
  if (!fullName) return '';

  const prefixes = [
    'Mr',
    'Mr.',
    'Mrs',
    'Mrs.',
    'Miss',
    'Ms',
    'Ms.',
    'Dr',
    'Dr.',
    'Prof',
    'Prof.',
  ];
  const nameParts = fullName.split(' ');

  if (nameParts.length > 1 && prefixes.includes(nameParts[0])) {
    return `${nameParts[0]} ${nameParts[1]}`;
  }

  return nameParts[0];
};
