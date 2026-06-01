"use client";

import React, { useState, useEffect } from "react";
import { useProjectStore } from "@/stores/project";
import { 
  Database, 
  Table, 
  Terminal, 
  Play, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Layers,
  ChevronRight,
  DatabaseZap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DBColumn {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

interface DBTable {
  name: string;
  columns: DBColumn[];
}

export default function DatabaseViewer() {
  const { files, createFile, saveFileToDb } = useProjectStore();
  const [tables, setTables] = useState<DBTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [sqlConsole, setSqlConsole] = useState<string>("SELECT * FROM users;");
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tables" | "console">("tables");
  const [mockRows, setMockRows] = useState<Record<string, any[]>>({});

  // 1. Search for SQL schema files
  const getSqlContent = () => {
    // Check supabase/schema.sql first
    if (files["supabase/schema.sql"]) {
      return { path: "supabase/schema.sql", content: files["supabase/schema.sql"].content };
    }
    // Check migration files
    const migrationFile = Object.keys(files).find(
      (path) => path.startsWith("supabase/migrations/") && path.endsWith(".sql")
    );
    if (migrationFile) {
      return { path: migrationFile, content: files[migrationFile].content };
    }
    return null;
  };

  const sqlData = getSqlContent();

  // 2. Parse SQL on file changes
  useEffect(() => {
    if (sqlData) {
      try {
        const parsed = parseSQLSchema(sqlData.content);
        setTables(parsed);
        if (parsed.length > 0 && !selectedTable) {
          setSelectedTable(parsed[0].name);
        }
        
        // Generate mock rows for each table
        const rowsMap: Record<string, any[]> = {};
        parsed.forEach(table => {
          rowsMap[table.name] = generateMockRows(table.columns);
        });
        setMockRows(rowsMap);
      } catch (err) {
        console.error("SQL parse error:", err);
      }
    } else {
      setTables([]);
      setSelectedTable(null);
    }
  }, [files, sqlData?.content]);

  // Helper: Split columns by comma ignoring nested parens
  const splitSQLColumns = (text: string): string[] => {
    const result: string[] = [];
    let current = "";
    let parenDepth = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;
      
      if (char === "," && parenDepth === 0) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      result.push(current);
    }
    return result;
  };

  // Helper: Parse schema SQL to extract tables & columns
  const parseSQLSchema = (sql: string): DBTable[] => {
    const result: DBTable[] = [];
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_0-9\.\"\']+)\s*\(([\s\S]+?)\);/gi;
    let match;
    
    while ((match = tableRegex.exec(sql)) !== null) {
      const rawTableName = match[1].replace(/['""`]/g, "");
      const tableName = rawTableName.includes(".") ? rawTableName.split(".")[1] : rawTableName;
      const columnsText = match[2];
      
      const columns: DBColumn[] = [];
      const lines = splitSQLColumns(columnsText);
      
      lines.forEach(line => {
        const cleanLine = line.trim().replace(/\s+/g, " ");
        if (
          !cleanLine || 
          cleanLine.toUpperCase().startsWith("CONSTRAINT") || 
          cleanLine.toUpperCase().startsWith("PRIMARY KEY") || 
          cleanLine.toUpperCase().startsWith("FOREIGN KEY") ||
          cleanLine.toUpperCase().startsWith("UNIQUE")
        ) {
          return;
        }
        
        const parts = cleanLine.split(" ");
        if (parts.length >= 2) {
          const colName = parts[0].replace(/['""`]/g, "");
          const colType = parts[1].toLowerCase();
          const isPrimaryKey = cleanLine.toUpperCase().includes("PRIMARY KEY");
          const isNullable = !cleanLine.toUpperCase().includes("NOT NULL");
          
          columns.push({
            name: colName,
            type: colType,
            isNullable,
            isPrimaryKey
          });
        }
      });
      
      result.push({ name: tableName, columns });
    }
    
    return result;
  };

  // Helper: Generate structured mock rows
  const generateMockRows = (columns: DBColumn[]): any[] => {
    const rows = [];
    for (let r = 1; r <= 4; r++) {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const name = col.name.toLowerCase();
        if (col.isPrimaryKey) {
          if (col.type.includes("uuid")) {
            row[col.name] = `f81d4fae-7dec-11d0-a765-00a0c91e6bf${r}`;
          } else {
            row[col.name] = r;
          }
          return;
        }

        if (name.includes("email")) {
          row[col.name] = `user${r}@opviber.com`;
        } else if (name.includes("name") || name.includes("display")) {
          const names = ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince"];
          row[col.name] = names[r - 1] || "John Doe";
        } else if (name.includes("title") || name.includes("subject")) {
          const titles = ["Create homepage", "Configure Stripe", "Fix visual bugs", "Setup deployment"];
          row[col.name] = titles[r - 1] || "Sample Task";
        } else if (name.includes("status")) {
          const statuses = ["todo", "in_progress", "completed", "todo"];
          row[col.name] = statuses[r - 1];
        } else if (col.type.includes("bool") || col.type.includes("boolean")) {
          row[col.name] = r % 2 === 0;
        } else if (col.type.includes("timestamp") || col.type.includes("date")) {
          row[col.name] = new Date(Date.now() - r * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        } else if (col.type.includes("int") || col.type.includes("numeric") || col.type.includes("serial")) {
          row[col.name] = r * 10;
        } else {
          row[col.name] = `Value ${r}`;
        }
      });
      rows.push(row);
    }
    return rows;
  };

  const handleGenerateSchema = async () => {
    const schemaContent = `-- Create users profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks / todo items table
CREATE TABLE IF NOT EXISTS public.todos (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);`;
    
    await createFile("supabase/schema.sql", schemaContent);
    await saveFileToDb("supabase/schema.sql");
    toast.success("Database schema created at supabase/schema.sql!");
  };

  const handleRunQuery = () => {
    setQueryResult(null);
    setQueryError(null);

    const query = sqlConsole.trim().replace(/;$/, "");
    if (!query) return;

    const selectMatch = query.match(/select\s+\*\s+from\s+([a-zA-Z0-9_]+)/i);
    
    if (selectMatch) {
      const targetTable = selectMatch[1].toLowerCase();
      const match = tables.find(t => t.name.toLowerCase() === targetTable);
      
      if (match) {
        setQueryResult(mockRows[match.name] || []);
        toast.success("Query executed successfully!");
      } else {
        setQueryError(`Table "${targetTable}" does not exist.`);
      }
    } else {
      setQueryError("Only simple 'SELECT * FROM <table_name>' queries are supported in the preview console.");
    }
  };

  const activeTableData = tables.find(t => t.name === selectedTable);

  return (
    <div className="flex flex-col h-full bg-zinc-950/40">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/20 text-xs h-9 px-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTab("tables")}
            className={`h-7 px-2.5 ${activeTab === "tables" ? "text-violet-400 bg-zinc-900" : "text-zinc-400"}`}
          >
            <Database size={12} className="mr-1" />
            Tables & Data
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTab("console")}
            className={`h-7 px-2.5 ${activeTab === "console" ? "text-violet-400 bg-zinc-900" : "text-zinc-400"}`}
          >
            <Terminal size={12} className="mr-1" />
            SQL Console
          </Button>
        </div>

        {sqlData && (
          <span className="text-[10px] text-zinc-550 truncate max-w-[140px]" title={sqlData.path}>
            Schema: {sqlData.path.split("/").pop()}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto p-4 space-y-4">
            <div className="p-3 bg-violet-600/10 rounded-full text-violet-400">
              <DatabaseZap size={24} className="animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">No Database Schema Found</h3>
            <p className="text-xs text-zinc-550 leading-relaxed">
              Define database tables in your project by writing standard PostgreSQL DDL schemas.
            </p>
            <Button
              size="sm"
              onClick={handleGenerateSchema}
              className="bg-violet-600 hover:bg-violet-750 text-white text-xs gap-1.5"
            >
              <Sparkles size={12} />
              Scaffold supabase/schema.sql
            </Button>
          </div>
        ) : activeTab === "tables" ? (
          <div className="flex h-full overflow-hidden">
            {/* Table Navigation (Left inside panel) */}
            <div className="w-1/3 border-r border-zinc-900 h-full overflow-y-auto py-2">
              <span className="text-[9px] uppercase font-bold text-zinc-650 tracking-widest px-3 block mb-1">Tables</span>
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={`flex items-center gap-1.5 w-full py-1.5 px-3 text-left text-xs transition truncate ${
                    selectedTable === t.name 
                      ? "bg-violet-500/10 text-violet-400 font-medium" 
                      : "text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200"
                  }`}
                >
                  <Table size={12} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            {/* Table Details & Mock Rows (Right inside panel) */}
            <div className="w-2/3 h-full overflow-y-auto p-3 flex flex-col space-y-4">
              {activeTableData && (
                <>
                  {/* Columns Schema */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1">
                      <Layers size={11} className="text-violet-400" />
                      Columns & Schema
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-zinc-950/40 p-2 rounded-lg border border-zinc-900">
                      {activeTableData.columns.map((c) => (
                        <div key={c.name} className="flex justify-between items-center p-1 bg-zinc-900/20 rounded">
                          <span className={`font-mono truncate ${c.isPrimaryKey ? "text-amber-500 font-semibold" : "text-zinc-300"}`}>
                            {c.name} {c.isPrimaryKey && "🔑"}
                          </span>
                          <span className="text-[10px] text-zinc-550 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">
                            {c.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rows Grid */}
                  <div className="flex-1 flex flex-col min-h-[160px]">
                    <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1">
                      <Database size={11} className="text-violet-400" />
                      Data Grid Viewer
                    </h4>
                    
                    <div className="flex-1 border border-zinc-900 rounded-lg overflow-x-auto bg-zinc-950/40">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900 text-zinc-400 uppercase tracking-wider text-[9px] border-b border-zinc-900">
                            {activeTableData.columns.map(c => (
                              <th key={c.name} className="p-2 border-r border-zinc-900 font-bold truncate">
                                {c.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mockRows[activeTableData.name] && mockRows[activeTableData.name].map((row, idx) => (
                            <tr key={idx} className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition">
                              {activeTableData.columns.map(c => (
                                <td key={c.name} className="p-2 border-r border-zinc-900 font-mono text-zinc-300 truncate max-w-[120px]">
                                  {String(row[c.name] ?? "NULL")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* SQL Console */
          <div className="h-full flex flex-col p-3 space-y-3">
            <div className="relative border border-zinc-800 rounded-lg bg-zinc-950/60 p-2 flex flex-col">
              <span className="text-[10px] text-zinc-500 font-mono uppercase mb-1">SQL Editor</span>
              <textarea
                value={sqlConsole}
                onChange={(e) => setSqlConsole(e.target.value)}
                className="w-full h-[60px] bg-transparent resize-none focus:outline-none font-mono text-[11px] text-zinc-300 placeholder-zinc-700"
              />
              <div className="flex justify-end mt-1">
                <Button
                  size="sm"
                  onClick={handleRunQuery}
                  className="bg-violet-600 hover:bg-violet-750 text-white h-7 px-2.5 text-xs gap-1"
                >
                  <Play size={10} />
                  Run
                </Button>
              </div>
            </div>

            {/* Console Output */}
            <div className="flex-1 flex flex-col border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950/40">
              <span className="text-[9px] uppercase font-bold text-zinc-650 tracking-widest p-2 bg-zinc-900/50 border-b border-zinc-900">
                Console Output
              </span>
              
              <div className="flex-1 overflow-auto p-2 font-mono text-[11px] text-zinc-400">
                {queryError && (
                  <div className="flex items-start gap-1.5 text-rose-400 bg-rose-950/10 p-2 rounded border border-rose-900/30">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>{queryError}</span>
                  </div>
                )}

                {queryResult && (
                  <div className="overflow-x-auto">
                    {queryResult.length === 0 ? (
                      <div className="text-zinc-600 p-2 italic">Query returned 0 rows.</div>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-500 text-left">
                            {Object.keys(queryResult[0]).map(key => (
                              <th key={key} className="p-1.5 font-bold border-r border-zinc-900">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.map((row, idx) => (
                            <tr key={idx} className="border-b border-zinc-900/50 hover:bg-zinc-900/10">
                              {Object.values(row).map((val: any, colIdx) => (
                                <td key={colIdx} className="p-1.5 text-zinc-300 border-r border-zinc-900">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {!queryResult && !queryError && (
                  <div className="text-zinc-600 italic p-2">Ready to run query...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
