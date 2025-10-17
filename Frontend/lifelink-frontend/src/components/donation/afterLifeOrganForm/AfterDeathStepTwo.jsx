import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AliveOrganFormSecondStep({prevStep, nextStep, afterDeathFormData}){
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!afterDeathFormData) {
            navigate("/donation/after-death-organ-form/stepOne");
        }
    }, [afterDeathFormData, navigate]);

    const [maritalState, setMartialState] = useState("")
    const [profState, setProfState] = useState ("")
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
        setFileName(e.target.files[0].name);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        if (!e.target.checkValidity()) {
            e.target.reportValidity(); 
            return;
        }

        nextStep();
    };

    return(
        <section className="organ donation-section">
            <div className="container">
                <div>
                    <div className="steps">
                            <div className="step">
                                <div className="step-at">
                                    <span className="span linear-blue">G</span>
                                    <div className="small-line linear-blue"></div>
                                </div>
                                <small>Genral Info</small>
                            </div>

                        <div className="step">
                                <div className="step-at">
                                    <span className="span linear-blue">P</span>
                                    <div className="small-line"></div>
                                </div>
                                <small>Personal Info</small>
                            </div>

                            <div className="step">
                                <div className="step-at">
                                    <span className="span">O</span>
                                </div>
                                <small>Organ Submission</small>
                            </div>
                    </div>
                </div>

                <div>
                    <div className="title bg-blue-color">
                            <h2 className="text-center">Perosnal Information</h2>
                        </div>

                    <div className="form-container">
                            {/* Form Starts Here */}
                            <div>
                                <form action="#" className="form" onSubmit= { handleSubmit }>
                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="martial-state">Marital Status</label>
                                            <select 
                                                id="martial-state"
                                                value= { maritalState } 
                                                onChange={(e) => setMartialState(e.target.value)} 
                                                required
                                            >
                                                <option value="" disabled selected>Select a state</option>
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="divorced">Divorced or separated</option>
                                                <option value="widowed">Widowed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="education-level">Education Level</label>
                                            <select 
                                                id="education-level" 
                                                required
                                            >
                                                <option value="" disabled selected>Select one</option>
                                                <option value="elementary">Elementary</option>
                                                <option value="intermediate">Intermediate</option>
                                                <option value="secondary">Secondary</option>
                                                <option value="university">University</option>
                                                <option value="graduate">Graduate</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="prof-state">professional Status</label>
                                            <select 
                                                id="prof-state" 
                                                value= { profState }
                                                onChange={ (e) => setProfState(e.target.value) }
                                                required
                                            >
                                                <option value="" disabled selected>Select a state</option>
                                                <option value="no-work">I do not work</option>
                                                <option value="working">I work</option>
                                            </select>
                                        </div>
                                    </div>

                                    {maritalState === "single" &&
                                        <div className="form-group">
                                            <div>
                                                <label for="mother-name">Mother's Full Name</label>
                                                <input type="text" id="mother-name" name="mother-name" placeholder="Enter mother's full name"required/>
                                            </div>
                                        </div>
                                    }

                                    {(maritalState === "married" || maritalState === "divorced" || maritalState === "widowed") && (
                                        <div className="form-group">
                                            <div>
                                                <label for="w/h-name">Wife / Husband 's Full Name</label>
                                                <input type="text" id="w/h-name" name="wife/hus-name" placeholder="Enter full name" required/>
                                            </div>
                                        </div>
                                    )
                                    }

                                    {profState === "working" &&
                                        <div className="form-group">
                                            <div>
                                                <label for="work-type">State Your Work Type</label>
                                                <input type="text" id="work-type" name="work-type" placeholder="Enter your work description" required/>
                                            </div>
                                        </div>
                                    }
                                    

                                    <div className="file-upload-container">
                                        <p>Please Upload Below a Photo of Your ID</p>
                                        <div>
                                            <input
                                                type="text"
                                                name="pers_Id"
                                                readOnly
                                                value={fileName}
                                                placeholder="No file chosen"
                                                className="file-name-display"
                                            />
                                            <label className="file-upload-btn">
                                                Browse File
                                                <input type="file" name="pers" onChange={handleFileChange} style={{ display: "none" }}/>
                                            </label>
                                        </div>
                                    </div>

                                    { afterDeathFormData.age < 18 && 
                                    <>
                                        <div className="file-upload-container">
                                            <p>Please Upload Below a Photo of Your Father's ID</p>
                                            <div>
                                                <input
                                                    type="text"
                                                    name="father_Id"
                                                    readOnly
                                                    value= { fileName }
                                                    placeholder="No file chosen"
                                                    className="file-name-display"
                                                />
                                                <label className="file-upload-btn">
                                                    Browse File
                                                    <input type="file" name="father" onChange={handleFileChange} style={{ display: "none" }} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="file-upload-container">
                                            <p>Please Upload Below a Photo of Your Mother's ID</p>
                                            <div>
                                                <input
                                                    type="text"
                                                    name="mother_Id"
                                                    readOnly
                                                    value={ fileName }
                                                    placeholder="No file chosen"
                                                    className="file-name-display"
                                                />
                                                <label className="file-upload-btn">
                                                    Browse File
                                                    <input type="file" name="mother" onChange={handleFileChange} style={{ display: "none" }} />
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                    }
                            
                                    <div className="line"></div>

                                    <div className="buttons-align">
                                        <button type="button" className="cancel-btn prev-btn"
                                                onClick = { prevStep }
                                            >Previous</button>
                                        
                                        <div>
                                            <button type="button" className="cancel-btn"
                                                onClick={
                                                    ()=> navigate("/donation/after-death-donation")
                                                }
                                            >Cancel</button>
                                            <button type="submit" className="next-step-btn bg-blue-color" >Next Step</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                </div>
            </div>
        </section>
    )
}
