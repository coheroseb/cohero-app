
export async function fetchFolketingetSagById(id: number) {
    try {
        const response = await fetch(`https://oda.ft.dk/api/Sag(${id})?$format=json`);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching FT sag ${id}:`, error);
        return null;
    }
}
