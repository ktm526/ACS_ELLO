import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import "./LogViewer.css";

/**
 * LogViewer – 시스템 로그 모니터링 페이지
 * - 10초 주기 자동 새로고침 + 수동 새로고침 버튼
 * - 날짜 범위 & 메서드(GET/POST/...) 필터링
 * - CSV 다운로드
 * 디자인은 MapViewer 와 동일한 헤더 / 패널 스타일을 사용
 */
import ListIcon from "../../assets/icons/list.svg";

const METHODS = ["ALL", "POST", "PUT", "PATCH", "DELETE"];

export default function LogViewer() {
  /* ---------------- 상태 ---------------- */
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  /* 필터 */
  const [dateFrom, setDateFrom] = useState(
    dayjs().subtract(1, "day").format("YYYY-MM-DD")
  );
  const [dateTo, setDateTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [method, setMethod] = useState("ALL");

  /* auto refresh timer ref */
  const timerRef = useRef(null);

  /* ---------------- 데이터 로딩 ---------------- */
  const fetchLogs = async () => {
    setLoading(true);
    try {
      //const res = await axios.get("http://localhost:3000/api/logs");
      const API = import.meta.env.VITE_CORE_BASE_URL; // Vite
      const res = await axios.get(`${API}/api/logs`);
      if (res.data?.data) setLogs(res.data.data);
    } catch (e) {
      console.error("fetch logs error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    timerRef.current = setInterval(fetchLogs, 10_000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ---------------- 필터링 ---------------- */
  useEffect(() => {
    const from = dayjs(dateFrom).startOf("day");
    const to = dayjs(dateTo).endOf("day");
    const list = logs.filter((l) => {
      const t = dayjs(l.request_time);
      const dateOK = t.isAfter(from) && t.isBefore(to);
      const methodOK = method === "ALL" || l.method === method;
      return dateOK && methodOK;
    });
    setFiltered(list);
  }, [logs, dateFrom, dateTo, method]);

  /* ---------------- CSV 다운로드 ---------------- */
  const downloadCSV = () => {
    if (!filtered.length) return;
    const header = Object.keys(filtered[0]).join(",") + "\n";
    const rows = filtered
      .map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="log-viewer">
      {/* 헤더 */}
      <div className="list-header">
        <div className="header-left">
          <img
            className="header-icon"
            src={ListIcon}
            alt="List Icon"
            width="16"
            height="16"
          />
          <h2>로그 조회</h2>
        </div>
        <div className="header-right">
          <button onClick={fetchLogs}>새로고침</button>
          <button onClick={downloadCSV}>CSV 다운로드</button>
        </div>
      </div>

      {/* 필터 패널 */}
      <div className="filter-panel">
        <label>
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
        <label>
          Method
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <span className="count-chip">{filtered.length}건</span>
      </div>

      {/* 테이블 */}
      <div className="table-wrapper">
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading…</p>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Time</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Resp(ms)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{dayjs(l.request_time).format("YY-MM-DD HH:mm:ss")}</td>
                  <td>{l.method}</td>
                  <td>{l.endpoint}</td>
                  <td>{l.status_code}</td>
                  <td>
                    {l.response_time
                      ? dayjs(l.response_time).diff(dayjs(l.request_time), "ms")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
