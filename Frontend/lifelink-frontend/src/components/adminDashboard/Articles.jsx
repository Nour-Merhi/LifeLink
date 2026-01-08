import { useState, useEffect } from "react";
import { RiArticleLine } from "react-icons/ri";
import "../../styles/Dashboard.css"
import api from "../../api/axios";

import ArticleTable from "./articleComponents/ArticleTable"
import AddArticleForm from "./articleComponents/AddArticleForm"

export default function Articles(){
    const [openModal, setModal] = useState(false);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");     
    const onClose = () => {
        setModal(false)
    }

    const fetchArticles = ()=>{
        setLoading(true);
        setError("");

        api.get('/api/admin/dashboard/articles')
            .then((res) => {
                console.log('Articles API Response:', res.data);
                const articlesData = res.data.articles || res.data || [];
                setArticles(Array.isArray(articlesData) ? articlesData : []);
            })
            .catch(err => {
                console.error('Error fetching articles:', err);
                console.error('Error response:', err.response);
                setError(err.response?.data?.message || err.message || "An error occurred while fetching articles")
            })
            .finally(() => setLoading(false))
    }

    const onArticleAdded = () => {
        fetchArticles(); // Refetch articles list
        setModal(false); // Close modal
    }

    useEffect(()=> {
        fetchArticles();
    }, []);
    
    return (
        <section className="hospital-panel">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <RiArticleLine className="icon-size "/>
                        <h2>Articles Management</h2>
                    </div>
                    <p>Create and manage articles to be displayed on the home page</p>
                </div>
                <div className="add-btn">
                    <button type="button" onClick={() => setModal(true)}>+ Add New Article</button>
                </div>
            </div>

            <ArticleTable 
                articles = { articles }
                loading = { loading }
                error = { error }
                onArticlesUpdate = { fetchArticles }
            />
            
            {openModal && 
                <AddArticleForm onClose = { onClose } onArticleAdded = { onArticleAdded } />
            }
            
        </section>
    )
}

