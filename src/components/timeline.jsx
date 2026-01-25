import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { db, auth } from "../firebase";
import Log from "./log";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export default function Timeline() {
  const [logs, setLogs] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    let unsubscribe = null;
    
    const fetchLogs = async () => {
      const logsQuery = query(
        collection(db, "logs"), 
        orderBy("createdAt", "desc"),
        limit(25)
      );
      
      unsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logsData = snapshot.docs.map((doc) => {
          const { log, createdAt, userId, username, photo, referenceDate, isBot } = doc.data();
          return {
            log,
            createdAt,
            userId,
            username,
            photo,
            referenceDate,
            isBot,
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
  }, [user]);

  return (
    <Wrapper>
      {logs.map((logItem) => (
        <Log key={logItem.id} {...logItem} /> 
      ))}
    </Wrapper>
  );
}