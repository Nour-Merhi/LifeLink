import { useState, useEffect } from "react"
import { IoSearchSharp } from "react-icons/io5";
import { FiEye, FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";

export default function Transactions({ transactions }){
    const [searchTerm, setSearchTerm] = useState("");
    const [transactionState, setTransactionState] = useState("all-states");
    const [paymentMethod, setPaymentMethod] = useState("all-methods");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    
    useEffect(()=>{
        setCurrentPage(1);
    }, [searchTerm, transactionState])

    //Filtering orders based on search term, status and severity
    const filteredTransactions = transactions ? transactions.filter((tran) => {
        const matchesSearch = tran.donor_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = transactionState === "all-states" || tran.status?.toLowerCase() === transactionState.toLowerCase();
        const matchesPaymentMethod = paymentMethod === "all-methods" || tran.payment_method?.toLowerCase() === paymentMethod.toLowerCase();

        return matchesSearch && matchesStatus && matchesPaymentMethod;
    }) : [];

    //Calculate paginiation values
    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.ceil(totalTransactions / itemsPerPage);

    //Calculating which items should show
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    //Displaying text
    const startDisplay = startIndex + 1;
    const endDisplay = Math.min(endIndex, totalTransactions);

    return(
        <section className="hospital-table-section">
            <div className="control-panel">
                <div className="control">
                    <div >
                        <h4>Transaction History</h4>
                        <span className="text-sm text-gray-500">Monitor all financial transactions and payments</span>
                    </div>
                </div>

                <div className="control-panel-layout">
                    <div className="control-panel-layout-left">
                        <div className="search-input">
                            <IoSearchSharp />
                            <input 
                                type="search" 
                                placeholder="Search by donor name..." 
                                value = {searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-gap">
                        <div className="filters">
                            <select 
                                value = { paymentMethod } 
                                onChange = { (e) => setPaymentMethod (e.target.value) }
                            >
                                <option value = "all-methods" >All Payment Methods</option>
                                <option value = "credit_card" >Credit Card</option>
                                <option value = "wish_money" >Wish Money</option>
                                <option value = "cash" >Cash in Hospital</option>
                            </select>
                        </div>
                        <div className="filters">
                            <select 
                                value = { transactionState } 
                                onChange = { (e) => setTransactionState (e.target.value) }
                            >
                                <option value = "all-states" >All states</option>
                                <option value = "completed" >Completed</option>
                                <option value = "failed" >Failed</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="table-design">
                <table className="h1-table">
                    <thead>
                        <tr>
                            <th className="col-select">
                                <input className="ml-3" type="checkbox" aria-label="select all"/>
                            </th>
                            <th className="col-trans-id">Trans ID</th>
                            <th className="text-left col-donor">Donor</th>
                            <th className="col-amount">Amount</th>
                            <th className="col-payment">Payment Method</th>
                            <th className="col-beneficiary">Beneficiary</th>
                            <th className="col-hospital col-amount">Hospital</th>
                            <th className="col-date">Trans Date</th>
                            <th className="col-status">Status</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTransactions.map ((transaction, index) => (
                            <tr key={`${transaction.id}-${startIndex + index}`}>
                                <td className="col-select">
                                    <input className="ml-3" type="checkbox" aria-label={`select ${transaction.id}`}/>
                                </td>
                                <td className="col-trans-id">
                                    <div className="cell-title">
                                        <strong title={transaction.id}>{transaction.id}</strong>
                                        <small className="muted">{transaction.created_at}</small>
                                    </div>
                                </td>
                                <td className="col-donor">
                                    <strong>{transaction.donor_name}</strong>
                                    <small className="muted">{transaction.donor_id}</small>
                                </td>
                                <td className="col-amount">
                                    <strong className="amount-value">${transaction.amount.toLocaleString()}</strong>
                                </td>
                                <td className="col-payment">
                                    <span>{transaction.payment_method === "credit_card" ? "Credit Card" : transaction.payment_method === "wish_money" ? "Wish Money" : "Cash"}</span>
                                </td>
                                <td className="col-beneficiary">
                                    <span>{transaction.beneficiary_name}</span>
                                </td>
                                <td className="col-hospital col-amount">
                                    <span>{transaction.hospital_name}</span>
                                </td>
                                <td className="col-date">
                                    <div className="cell-date">
                                        <span>{transaction.date}</span>
                                        <span className="muted">{transaction.time}</span>
                                    </div>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${
                                        transaction.status === "completed" ? "badge-success" : 
                                        transaction.status === "pending" ? "badge-pending" : 
                                        "badge-danger"
                                    }`}>
                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                    </span>
                                </td>
                            
                                <td className="col-actions">
                                    <div className="row-actions">
                                        <button className="icon-btn text-blue-800"><FiEye /></button>
                                        <button className="icon-btn text-green-600"><FiEdit /></button>
                                        <button className="icon-btn text-red-500"><RiDeleteBin6Line /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    
                    </tbody>
                </table>
                
                <div className="pagination">
                    <div className="showing">
                        <small className="muted">Showing {startDisplay} to {endDisplay} of {totalTransactions} transactions</small>
                    </div>
                    <div className="pagination-controls">
                        <button 
                            onClick = {()=> setCurrentPage(prev => Math.max(1, prev -1))}
                            disabled = {currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>

                        {/*page Number Buttons*/}
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
        </section>
    );
}