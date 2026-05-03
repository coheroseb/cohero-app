import { onRequest } from "firebase-functions/v2/https";
import axios from "axios";

const BASE_URL = "https://api.retsinformation.dk/v2";

export const retsinformationProxy = onRequest({ 
  timeoutSeconds: 60, 
  memory: "512MiB",
  cors: true 
}, async (req, res) => {
  const path = req.query.path as string;
  const filter = req.query.filter as string;
  const top = req.query.top as string;
  const orderby = req.query.orderby as string;

  if (!path) {
    res.status(400).send("Path parameter is required");
    return;
  }

  try {
    let url = `${BASE_URL}/${path}`;
    const params = new URLSearchParams();
    if (filter) params.append("$filter", filter);
    if (top) params.append("$top", top);
    if (orderby) params.append("$orderby", orderby);

    const queryString = params.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }

    console.log(`[RetsinformationProxy] Fetching: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'Accept': req.headers.accept || 'application/json',
      },
      responseType: req.headers.accept?.includes('text') ? 'text' : 'json'
    });

    res.status(200).send(response.data);
  } catch (error: any) {
    console.error(`[RetsinformationProxy] Error:`, error.message);
    res.status(error.response?.status || 500).send(error.response?.data || error.message);
  }
});
