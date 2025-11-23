import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";

export default function AddTemplateForm({ onClose, onSelectTemplate }) {
    const [templates, setTemplates] = useState([
        {
            id: "T001",
            title: "Appointment Reminder",
            category: "reminders",
            usage: 1247,
            last_used: "2024-01-15"
        },
        {
            id: "T002",
            title: "Blood Shortage Alert",
            category: "Urgent",
            usage: 1247,
            last_used: "2024-01-15"
        },
        {
            id: "T003",
            title: "Thank You Message",
            category: "Appreciation",
            usage: 1247,
            last_used: "2024-01-15"
        },
        {
            id: "T004",
            title: "Campaign Launch",
            category: "Fundings",
            usage: 1247,
            last_used: "2024-01-15"
        },
        {
            id: "T005",
            title: "Campaign Launch",
            category: "Fundings",
            usage: 1247,
            last_used: "2024-01-15"
        },
        {
            id: "T006",
            title: "Campaign Launch",
            category: "Fundings",
            usage: 1247,
            last_used: "2024-01-15"
        },
        {
            id: "T007",
            title: "Campaign Launch",
            category: "Fundings",
            usage: 1247,
            last_used: "2024-01-15"
        }
    ]);

    const handleUseTemplate = (template) => {
        if (onSelectTemplate) {
            onSelectTemplate(template);
        }
        onClose();
    };

    const handleEditTemplate = (templateId) => {
        console.log("Edit template:", templateId);
        // Edit functionality will be implemented
    };

    return (
        <section className="modal" onClick={onClose}>
            <div className="modal-container template-modal">
                <div className="modal-title">
                    <h2>Notification Templates</h2>
                    <button onClick={onClose}><IoClose /></button>
                </div>

                <div className="templates-grid">
                    {templates.map((template) => (
                        <div key={template.id} className="template-card">
                            <div className="template-header">
                                <h4>{template.title}</h4>
                                <span className="template-category">{template.category}</span>
                            </div>
                            
                            <div className="template-stats">
                                <span>Usage: {template.usage.toLocaleString()}</span>
                                <span>Last Used: {template.last_used}</span>
                            </div>

                            <div className="template-actions">
                                <button 
                                    className="use-template-btn"
                                    onClick={() => handleUseTemplate(template)}
                                >
                                    Use Template
                                </button>
                                <button 
                                    className="edit-template-btn"
                                    onClick={() => handleEditTemplate(template.id)}
                                >
                                    <FiEdit />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Empty template placeholder */}
                    <div className="template-card empty-template">
                        <div className="empty-template-content">
                            <span>+</span>
                        </div>
                    </div>
                </div>

                <div className="create-template-section">
                    <button className="create-template-btn">
                        + Create New Template
                    </button>
                </div>
            </div>
        </section>
    );
}

