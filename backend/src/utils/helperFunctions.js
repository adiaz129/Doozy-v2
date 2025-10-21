export const parseListString = (str) => {
    if (!str) return [];
    return str.split('; ').map(item => {
        const [id, name] = item.split(':');
        return { id: Number(id), name };
    });
};

export const parseIdList = (str) => {
    if (!str) return [];
    return str.split(',').map(id => Number(id));
};