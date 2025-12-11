import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase";
import Log from "./log";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export default function Timeline() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let unsubscribe = null;
    
    const fetchLogs = async () => {
      const logsQuery = query(
        collection(db, "logs"), 
        orderBy("createdAt", "desc"),
        limit(25)
      );
      
      unsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logsData = snapshot.docs.map((doc) => {
          const { log, createdAt, userId, username, photo, referenceDate } = doc.data();
          return {
            log,
            createdAt,
            userId,
            username,
            photo,
            referenceDate,
            id: doc.id,
          };
        });
        setLogs(logsData);
      });
    };
    
    fetchLogs();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <Wrapper>
      {logs.map((logItem) => (
        <Log key={logItem.id} {...logItem} /> 
      ))}
    </Wrapper>
  );
}