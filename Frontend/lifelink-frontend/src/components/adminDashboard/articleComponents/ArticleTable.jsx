import { useState, useEffect } from "react"
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function ArticleTable({ articles = [], loading = false, error = "", onArticlesUpdate }){
    const [articleStatus, setArticleStatus] = useState("all-status"); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, articleStatus])

    const handleDeleteClick = (articleCode, articleTitle) => {
        setDeleteConfirm({ articleCode, articleTitle });
        setDeleteError("");
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
        setDeleteError("");
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !deleteConfirm.articleCode) {
            setDeleteError("No article selected");
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            await api.delete(`/api/admin/dashboard/articles/${deleteConfirm.articleCode}`);

            setDeleteConfirm(null);
            if (onArticlesUpdate) {
                onArticlesUpdate();
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            setDeleteError(error.response?.data?.message || error.message || "Failed to delete article");
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch {
            return 'N/A';
        }
    };

    const transformedArticles = Array.isArray(articles) ? articles.map((article) => {
        return {
            id: article.code || `ART-${String(article.id).padStart(4, '0')}`,
            title: article.title || 'N/A',
            category: article.category || 'N/A',
            description: article.description || 'No description',
            status: article.is_published ? 'published' : 'draft',
            author: article.author ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() : 'N/A',
            created_at: formatDate(article.created_at),
            published_at: formatDate(article.published_at),
            _originalArticle: article
        }
    }) : [];

    const filteredArticles = transformedArticles.filter((article) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = article.title.toLowerCase().includes(searchLower) || 
                             article.category.toLowerCase().includes(searchLower) ||
                             article.id.toLowerCase().includes(searchLower);
        const matchesStatus = articleStatus === "all-status" || article.status === articleStatus;
        
        return matchesSearch && matchesStatus;
    })

    const totalArticles = filteredArticles.length;
    const totalPages = Math.ceil(totalArticles / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentArticles = filteredArticles.slice(startIndex, endIndex);
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalArticles);

    return(
        <section className="hospital-table-section">
            <div className="control-panel control-panel-layout">
                <div className="search-input">
                    <IoSearchSharp />
                    <input 
                        type="search" 
                        placeholder="Search by title, category, or code.." 
                        value = {searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <select 
                        value = { articleStatus } 
                        onChange = { (e) => setArticleStatus (e.target.value) }
                    >
                        <option value = "all-status" >All status</option>
                        <option value = "published" >Published</option>
                        <option value = "draft" >Draft</option>
                    </select>
                </div>
            </div>

            {loading && (
                <div className="loader">
                    <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                    <h3>Fetching Articles</h3>
              </div>
            )}

            {error && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#F12C31' }}>
                    <p>Error: {error}</p>
                </div>
            )}

            {!loading && !error && (
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="text-left col-hospital">Title</th>
                            <th className="col-address">Category</th>
                            <th className="col-status">Status</th>
                            <th className="col-contact">Author</th>
                            <th className="col-date">Created</th>
                            <th className="col-date">Published</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentArticles.length > 0 ? currentArticles.map ((article, index) => (
                            <tr key={`${article.id}-${startIndex + index}`}>
                                <td className="col-hospital">
                                    <div className="cell-title">
                                        <strong title={article.title}>{ article.title }</strong>
                                        <small className="muted">{ article.id }</small>
                                    </div>
                                </td>
                                <td className="col-address">
                                    <span>{ article.category }</span>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${article.status === "published" ? "badge-success" : "badge-danger"}`}>
                                        { article.status === "published" ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td className="col-contact">
                                    <span>{ article.author }</span>
                                </td>
                                <td className="col-date">{ article.created_at }</td>
                                <td className="col-date">{ article.published_at }</td>
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button 
                                            className="icon-btn text-green-600" 
                                            title="Edit"
                                            onClick={() => {/* TODO: Implement edit */}}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            className="icon-btn text-red-500" 
                                            title="Delete"
                                            onClick={() => handleDeleteClick(article.id, article.title)}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">No articles found</td>
                            </tr>
                        )}
                    
                    </tbody>
                </table>
                
                    <div className="pagination">
                        <div className="showing">
                            <small className="muted">Showing {startDisplay} to {endDisplay} of {totalArticles} articles</small>
                        </div>
                        <div className="pagination-controls">
                            <button 
                                onClick = {()=> setCurrentPage(prev => Math.max(1, prev -1))}
                                disabled = {currentPage === 1}
                                className="pagination-btn"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages}, (_, i) => i + 1).map((pageNum) =>(
                                <button
                                    key = {pageNum}
                                    onClick = {() => setCurrentPage(pageNum)}
                                    className={`pagination-btn ${currentPage === pageNum ? 'active': ''}`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                            
                            <button 
                                onClick = {() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled = {currentPage === totalPages}
                                className="pagination-btn"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay modal-overlay-delete">
                    <div className="modal-container modal-container-delete">
                        <div className="modal-title">
                            <h2>Delete Article</h2>
                            <button onClick={handleDeleteCancel} disabled={deleteLoading}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p>Are you sure you want to delete <strong>{deleteConfirm.articleTitle}</strong>?</p>
                            <p className="modal-text-secondary">
                                This action cannot be undone. The article will be permanently removed from the system.
                            </p>
                            
                            {deleteError && (
                                <div className="error-message modal-error-container">
                                    {deleteError}
                                </div>
                            )}

                            <div className="form-actions form-actions-modal">
                                <button 
                                    type="button" 
                                    onClick={handleDeleteCancel}
                                    disabled={deleteLoading}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                    className="submit-btn btn-delete-submit"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <SpinnerDotted size={20} thickness={100} speed={100} color="#fff" className="spinner-inline" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

