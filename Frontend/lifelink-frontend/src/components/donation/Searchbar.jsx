import { FaSearch } from "react-icons/fa";

export default function Searchbar(){
    return (
        <div className="search" >
            <div className="find-hospital">
                <h2>Find Hospital</h2>
                <p>Search for your desired hospital to donate blood to</p>
            </div>
            <div className="search-bar">
                <FaSearch />
                <input type="search" placeholder="Search a Hospital Name"/>
            </div>
        </div>
    )
}