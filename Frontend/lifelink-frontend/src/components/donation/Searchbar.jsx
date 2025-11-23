import { FaSearch } from "react-icons/fa";
import { useState } from "react";

export default function Searchbar({ onSearch }){

    return (
        <div className="search" >
            <div className="find-hospital">
                <h2>Find Hospital</h2>
                <p>Search for your desired hospital to donate blood to</p>
            </div>
            <div className="search-bar">
                <FaSearch />
                <input 
                    type="search" 
                    placeholder="Search a Hospital Name"
                    onChange={(e) => onSearch(e.target.value)} 
                />
            </div>
        </div>
    )
}