import { useContext, useEffect, useRef, useState } from "react";
import { RecommendForm } from "../../interfaces/recommendForm";
import { SongInfo } from "../../interfaces/songInfo";
import useSpotify from "../../utils/useSpotify";
import SongDisplay from "../Displays/SongDisplay";
import VolumeSlider from "../Misc/VolumeSlider";
import Pagination from "../Misc/Pagination";
import { AudioContext } from "./Views";
import { DevContext } from "../../App";
import usePlaylist from "../../utils/usePlaylist";
import { AudioFeatures } from "../../interfaces/audioFeatures";

export type SortBy =
    | "none"
    | "popularity"
    | "energy"
    | "acousticness"
    | "danceability"
    | "happiness";

export type SortOption = { label: string; sortBy: SortBy; descending: boolean };

const sortableOptions: SortOption[] = [
    { label: "None", sortBy: "none", descending: true },
    {
        label: "Popularity (Ascending)",
        sortBy: "popularity",
        descending: false,
    },
    {
        label: "Popularity (Descending)",
        sortBy: "popularity",
        descending: true,
    },
    { label: "Energy (Ascending)", sortBy: "energy", descending: false },
    { label: "Energy (Descending)", sortBy: "energy", descending: true },
    {
        label: "Acousticness (Ascending)",
        sortBy: "acousticness",
        descending: false,
    },
    {
        label: "Acousticness (Descending)",
        sortBy: "acousticness",
        descending: true,
    },
    {
        label: "Danceability (Ascending)",
        sortBy: "danceability",
        descending: false,
    },
    {
        label: "Danceability (Descending)",
        sortBy: "danceability",
        descending: true,
    },
    { label: "Happiness (Ascending)", sortBy: "happiness", descending: false },
    { label: "Happiness (Descending)", sortBy: "happiness", descending: true },
];

const ResultsPage = ({
    query,
    goBack,
    filters,
    changeSort,
}: {
    query: RecommendForm;
    goBack: () => void;
    filters: number;
    changeSort: (SortBy) => void;
}) => {
    const { devMode } = useContext(DevContext);
    const { audio, setAudioIsPlaying } = useContext(AudioContext);
    const { getRecommended } = useSpotify();
    const [songs, setSongs] = useState<SongInfo[]>([]);
    const [songsWithFeatures, setSongsWithFeatures] = useState<SongInfo[]>([]);
    const [message, setMessage] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [playlistSaved, setPlaylistSaved] = useState<boolean>(false);
    const [sortingOrder, setSortingOrder] = useState<SortOption>({
        label: "none",
        sortBy: "none",
        descending: true,
    });

    const { createPlaylist } = usePlaylist();

    const topRef = useRef(null);
    const isInitialMount = useRef(true);

    function scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    const addFeatureToSong = (id: string, features: AudioFeatures) => {
        const newSongs = songsWithFeatures;
        for (let i = 0; i < songsWithFeatures.length; i++) {
            if (songsWithFeatures[i].id === id) {
                songsWithFeatures[i].features = features;
            }
        }
        setSongsWithFeatures(newSongs);
    };

    const getSongs = async () => {
        const res = await getRecommended(query, 80);

        if (res === 2) {
            setMessage(
                "Sorry... there were no matches for your search. Maybe your tracks/artists were too obscure, or your search was too complicated"
            );
            setSongs([]);
            return;
        }

        setSongs(res.tracks);
    };

    useEffect(() => {
        getSongs();
    }, [query]);

    useEffect(() => {
        setPlaylistSaved(false);
        setSongsWithFeatures(songs);
    }, [songs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [query, songs]);

    useEffect(() => {
        if (audio !== null) {
            audio.pause();
            setAudioIsPlaying(false);
        }
    }, [currentPage, songs]);

    useEffect(() => {
        if (!isInitialMount.current) {
            changeSort(sortingOrder);
        } else {
            isInitialMount.current = false;
        }
    }, [sortingOrder]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Close tab?";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    const changePage = (page: number) => {
        setCurrentPage(page);
    };

    const uniqueTracks = songs
        ? songsWithFeatures.filter(
              (song, index, self) =>
                  index ===
                  self.findIndex(
                      (s) => s.external_ids.isrc === song.external_ids.isrc
                  )
          )
        : [];

    const displaysPerPage = 8;
    const indexOfLastItem = currentPage * displaysPerPage;
    const indexOfFirstItem = indexOfLastItem - displaysPerPage;
    const currentTracks = uniqueTracks.slice(indexOfFirstItem, indexOfLastItem);

    const results = currentTracks.map((song) => (
        <SongDisplay
            songInfo={song}
            statsButton={true}
            key={song.id}
            addFeatures={addFeatureToSong}
        />
    ));

    const handleSortChange = (value: SortOption) => {
        console.log(songsWithFeatures);
        setSortingOrder(value);
    };

    return (
        <div className="h-full flex flex-col items-center align-center gap-2 mt-12">
            <h2 className="grad text-xl">Search Results</h2>
            <VolumeSlider />
            <p className="grad text-center">
                Searching for {query.seed_tracks.length}{" "}
                {query.seed_tracks.length === 1 ? "song" : "songs"},{" "}
                {query.seed_artists.length}{" "}
                {query.seed_artists.length === 1 ? "artist" : "artists"},{" "}
                {query.seed_genres.length}{" "}
                {query.seed_genres.length === 1 ? "genre" : "genres"}
                <br />
                With {filters} {filters == 1 ? "filter" : "filters"} applied.
            </p>
            <div className="flex flex-col gap-1 text-center items-center">
                <div className="flex gap-1">
                    {sortingOrder.sortBy == "none" && (
                        <button className="button2" onClick={getSongs}>
                            <span className="grad">Reroll</span>
                        </button>
                    )}
                    <div className="flex text-center items-center">
                        {devMode && !playlistSaved && (
                            <button
                                className="button2"
                                onClick={() => {
                                    createPlaylist(uniqueTracks);
                                    setPlaylistSaved(true);
                                }}
                            >
                                <span className="grad">Save to Playlist</span>
                            </button>
                        )}
                    </div>
                    <button
                        className="button3"
                        id="backToSearchBtn"
                        onClick={goBack}
                        ref={topRef}
                    >
                        <span>Back to Search</span>
                    </button>
                </div>
                {devMode && playlistSaved && (
                    <span className="grad">
                        Created playlist on your Spotify!
                    </span>
                )}
                <div>
                    <p>Sort By:</p>
                    <select
                        className="border-[2px] p-1 border-purple-400 bg-dark3 rounded-[8px]"
                        value={sortingOrder.label}
                        onChange={(e) => {
                            const selectedLabel = e.target.value;
                            const selectedSortOption = sortableOptions.find(
                                (option) => option.label === selectedLabel
                            );
                            if (selectedSortOption) {
                                handleSortChange(selectedSortOption);
                            }
                        }}
                    >
                        {sortableOptions.map((option) => (
                            <option key={option.label} value={option.label}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {songs.length > 0 ? (
                <div
                    className="flex flex-col justify-center w-[100vw] items-center"
                    id="recommendResults"
                >
                    <div className="p-5 flex w-[95%] flex-col w-screen md:w-[70vw] lg:w-[60vw] xl:w-[50vw]">
                        {results}
                    </div>
                    <button
                        className="button2"
                        onClick={scrollToTop}
                        ref={topRef}
                    >
                        <span className="grad">Top</span>
                    </button>
                    <Pagination
                        totalDisplay={songs.length}
                        displaysPerPage={displaysPerPage}
                        paginate={changePage}
                        currentPage={currentPage}
                    />
                </div>
            ) : (
                <div className="flex text-center p-3">
                    <p>{message}</p>
                </div>
            )}
        </div>
    );
};

export default ResultsPage;
