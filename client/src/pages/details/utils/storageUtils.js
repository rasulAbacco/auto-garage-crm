export const loadHistory = () => {
    const data = localStorage.getItem("rcHistory");
    try {
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const saveRecord = (data) => {
    const record = { ...data, id: Date.now(), savedDate: new Date().toISOString() };
    const history = loadHistory();
    history.push(record);
    localStorage.setItem("rcHistory", JSON.stringify(history));
    return record;
};

export const deleteRecord = (id) => {
    const history = loadHistory().filter((r) => r.id !== id);
    localStorage.setItem("rcHistory", JSON.stringify(history));
};

export const clearHistory = () => localStorage.removeItem("rcHistory");
