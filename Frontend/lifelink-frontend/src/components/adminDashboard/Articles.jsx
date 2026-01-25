import { useState, useEffect } from "react";
import { RiArticleLine } from "react-icons/ri";
import "../../styles/Dashboard.css"
import api from "../../api/axios";

import ArticleTable from "./articleComponents/ArticleTable"
import AddArticleForm from "./articleComponents/AddArticleForm"
import EditArticleForm from "./articleComponents/EditArticleForm"
import GenerateAIArticleForm from "./articleComponents/GenerateAIArticleForm"

export default function Articles(){
    const [openModal, setModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openAIModal, setOpenAIModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
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

    const onEditClose = () => {
        setOpenEditModal(false);
        setEditingArticle(null);
    };

    const onAIClose = () => {
        setOpenAIModal(false);
    };

    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setOpenEditModal(true);
    };

    const onArticleUpdated = () => {
        fetchArticles();
        onEditClose();
    };

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
                    <button type="button" onClick={() => setOpenAIModal(true)}>
                        + Generate AI Article
                    </button>
                </div>
            </div>

            <ArticleTable 
                articles = { articles }
                loading = { loading }
                error = { error }
                onArticlesUpdate = { fetchArticles }
                onEditArticle = { handleEditArticle }
            />
            
            {openModal && 
                <AddArticleForm onClose = { onClose } onArticleAdded = { onArticleAdded } />
            }

            {openAIModal && (
                <GenerateAIArticleForm
                    onClose={onAIClose}
                    onAIGenerated={() => {
                        fetchArticles();
                    }}
                />
            )}

            {openEditModal && editingArticle && (
                <EditArticleForm
                    onClose={onEditClose}
                    onArticleUpdated={onArticleUpdated}
                    articleCode={editingArticle.code || editingArticle.id}
                    initialArticle={editingArticle}
                />
            )}
            
        </section>
    )
}

