import React, { useState } from "react";
import "./styles/App.css";
import JobModal from "./components/JobModal";
import InfoModal from "./components/InfoModal";
import Footer from "./components/Footer";
import AppOptions from "./components/AppOptions";
import AppList from "./components/AppList";

function App() {
  const [jobId, setJobId] = useState(null);
  const [searchTermName, setSearchTermName] = useState("");
  const [searchTermId, setSearchTermId] = useState("");
  const [statusFilter, setStatusFilter] = useState(["All"]);
  const [JobModalIsOpen, setJobModalIsOpen] = useState(false);
  const [InfoModalIsOpen, setInfoModalIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Batch Scheduler</h1>
      </header>
      <div className="App-container">
        <AppOptions
          searchTermName={searchTermName}
          searchTermId={searchTermId}
          statusFilter={statusFilter}
          setSearchTermName={setSearchTermName}
          setSearchTermId={setSearchTermId}
          setStatusFilter={setStatusFilter}
          setRefreshCounter={setRefreshCounter}
          setJobModalIsOpen={setJobModalIsOpen}
          setIsEditing={setIsEditing}
        />
        <AppList
          statusFilter={statusFilter}
          searchTermName={searchTermName}
          searchTermId={searchTermId}
          refreshCounter={refreshCounter}
          setRefreshCounter={setRefreshCounter}
          setJobModalIsOpen={setJobModalIsOpen}
          setIsEditing={setIsEditing}
          setInfoModalIsOpen={setInfoModalIsOpen}
          jobId={jobId}
          setJobId={setJobId}
          JobModalIsOpen={JobModalIsOpen}
        />
        <JobModal
          jobId={jobId}
          setJobId={setJobId}
          isOpen={JobModalIsOpen}
          isEditing={isEditing}
          setJobModalIsOpen={setJobModalIsOpen}
        />
        <InfoModal
          isOpen={InfoModalIsOpen}
          jobId={jobId}
          setInfoModalIsOpen={setInfoModalIsOpen}
        />
      </div>
      <Footer />
    </div>
  );
}

export default App;
