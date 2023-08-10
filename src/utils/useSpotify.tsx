import axios from "axios";
import { RecommendForm } from "../interfaces/recommendForm";
import { useContext } from "react";
import { TokenContext } from "../App";
const useSpotify = () => {
    const { token } = useContext(TokenContext);

    const getGenres = async () => {
        const url =
            "https://api.spotify.com/v1/recommendations/available-genre-seeds";

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const response = await axios.get(url, { headers });
            // You can access the artist data from the response here:
            return response.data.genres;
        } catch (error) {
            console.error("Error:", error);
            return [];
        }
    };

    const getFeatures = async (songId: string) => {
        return songId;
    };

    const getRecommended = async (songForm: RecommendForm) => {
        const url = "https://api.spotify.com/v1/recommendations";

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const arrayToString = (array: string[]) => {
                return array.join(",");
            };

            if (
                songForm.seed_tracks.length === 0 &&
                songForm.seed_artists.length === 0 &&
                songForm.seed_genres.length === 0
            ) {
                return 1;
            }

            const query = {
                seed_tracks: arrayToString(songForm.seed_tracks),
                seed_artists: arrayToString(songForm.seed_artists),
                seed_genres: arrayToString(songForm.seed_genres),
                // You can add other parameters here as needed
            };
            console.log(query);

            const response = await axios.get(url, {
                headers,
                params: query,
            });
            console.log(response.data);
            return response.data;
            // You can access the artist data from the response here:
        } catch (error) {
            console.error("Error:", error);
            return 2;
        }
    };

    const getSearch = async (query: string) => {
        const url = "https://api.spotify.com/v1/search";

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const response = await axios.get(url, {
                headers,
                params: {
                    q: query,
                    type: "track,artist",
                    limit: 10,
                },
            });
            console.log(response.data);
            return response.data;
            // You can access the artist data from the response here:
        } catch (error) {
            console.error("Error:", error);
            return null;
        }
    };

    return { getGenres, getRecommended, getSearch };
};

export default useSpotify;
