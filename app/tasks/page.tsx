"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Plus, AlertTriangle, UserPlus, Users, Calendar, MapPin, Send, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
    
    // New Task Form
    const [newTask, setNewTask] = useState({ title: "", blockId: "", employeeId: "", dueDate: "" });
    // New Emp Form
    const [newEmp, setNewEmp] = useState({ name: "", role: "Farm Hand", phoneNumber: "", email: "" });

    const fetchData = async () => {
        try {
            const [tasksRes, empRes, farmRes] = await Promise.all([
                fetch("/api/tasks"),
                fetch("/api/employees"),
                fetch("/api/farm")
            ]);
            
            if (tasksRes.ok) setTasks(await tasksRes.json());
            if (empRes.ok) setEmployees(await empRes.json());
            if (farmRes.ok) {
                const farm = await farmRes.json();
                if (farm && farm.blocks) setBlocks(farm.blocks);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
        
        // Optimistic update
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
        
        try {
            await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (newStatus === "COMPLETED") {
                toast.success("Task marked as completed!");
            }
        } catch (error) {
            toast.error("Failed to update task");
            fetchData(); // revert
        }
    };

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEmp)
            });
            if (res.ok) {
                toast.success("Employee added successfully!");
                setIsEmpModalOpen(false);
                setNewEmp({ name: "", role: "Farm Hand", phoneNumber: "", email: "" });
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to add employee");
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTask)
            });
            if (res.ok) {
                const createdTask = await res.json();
                
                // Simulate SMS Dispatch
                if (createdTask.assignee) {
                    toast.success(`Task assigned! SMS Reminder dispatched to ${createdTask.assignee.name} (${createdTask.assignee.phoneNumber})`, {
                        duration: 5000,
                        icon: <Send className="w-5 h-5 text-emerald-500" />
                    });
                } else {
                    toast.success("Task created successfully!");
                }

                setIsTaskModalOpen(false);
                setNewTask({ title: "", blockId: "", employeeId: "", dueDate: "" });
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    const handleDeleteEmployee = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to fire ${name}? They will be emailed a termination notice.`)) return;
        
        try {
            const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(`${name} has been removed from the farm.`);
                fetchData();
            } else {
                toast.error("Failed to delete employee");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent toggling task completion
        try {
            const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Task deleted successfully!");
                fetchData();
            } else {
                toast.error("Failed to delete task");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <AppPageHeader 
                    title="Farm Operations" 
                    subtitle="Manage tasks, coordinate employees, and track farm health" 
                />

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-slate-600 font-medium text-sm">Farm Health: </span>
                            <span className="text-emerald-600 font-bold text-2xl">92% </span>
                            <span className="text-emerald-600 font-semibold text-sm">Excellent</span>
                        </div>
                    </div>
                    <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">{employees.length} Active Workers</p>
                            <p className="text-slate-500 text-sm font-medium">Ready for assignment</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* TASKS COLUMN */}
                    <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
                        
                        <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-bold text-slate-800 text-xl">Daily Task Dispatch</h3>
                                <p className="text-slate-500 text-sm font-medium">Track completion and assignments</p>
                            </div>
                            
                            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/20 font-bold">
                                        <Plus className="h-4 w-4 mr-2" /> Assign Task
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] rounded-[24px]">
                                    <DialogHeader>
                                        <DialogTitle>Assign New Task</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Task Title</label>
                                            <Input required placeholder="e.g. Harvest Tomatoes" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Farm Block (Optional)</label>
                                            <Select value={newTask.blockId} onValueChange={v => setNewTask({...newTask, blockId: v})}>
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select a block" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {blocks.map(b => (
                                                        <SelectItem key={b.id} value={b.id}>{b.name} ({b.cropType})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Assign To Employee</label>
                                            <Select value={newTask.employeeId} onValueChange={v => setNewTask({...newTask, employeeId: v})}>
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select an employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map(e => (
                                                        <SelectItem key={e.id} value={e.id}>{e.name} - {e.role}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Due Date & Time</label>
                                            <Input type="datetime-local" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="rounded-xl border-slate-200" />
                                        </div>
                                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold mt-2">
                                            Dispatch & Notify
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-slate-400">Loading tasks...</div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-20 border border-slate-200 border-dashed rounded-[20px] bg-slate-50 relative z-10">
                                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-slate-600 font-bold text-lg mb-1">All caught up!</h3>
                                <p className="text-slate-500 font-medium">No pending tasks for your farm.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3 relative z-10">
                                {tasks.map(task => {
                                    const isCompleted = task.status === "COMPLETED";
                                    return (
                                        <li
                                            key={task.id}
                                            className={`flex items-center gap-4 p-4 rounded-[16px] border transition-all cursor-pointer ${isCompleted ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md'}`}
                                            onClick={() => toggleTask(task.id, task.status)}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle className="h-7 w-7 text-emerald-500 shrink-0" />
                                            ) : (
                                                <Circle className="h-7 w-7 text-slate-300 hover:text-emerald-500 shrink-0 transition-colors" />
                                            )}
                                            <div className="flex-1">
                                                <h4 className={`font-bold text-lg ${isCompleted ? "text-slate-500 line-through" : "text-slate-800"}`}>
                                                    {task.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-semibold text-slate-500">
                                                    {task.block && (
                                                        <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                                            <MapPin className="h-3.5 w-3.5 mr-1" /> {task.block.name}
                                                        </span>
                                                    )}
                                                    {task.assignee && (
                                                        <span className="flex items-center bg-amber-50 text-amber-700 px-2 py-1 rounded-md">
                                                            <UserPlus className="h-3.5 w-3.5 mr-1" /> {task.assignee.name}
                                                        </span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span className="flex items-center bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                            <Calendar className="h-3.5 w-3.5 mr-1" /> {new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteTask(e, task.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Task"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* EMPLOYEES COLUMN */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-xl">Farm Staff</h3>
                                    <p className="text-slate-500 text-sm font-medium">Manage team</p>
                                </div>
                                
                                <Dialog open={isEmpModalOpen} onOpenChange={setIsEmpModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm font-bold">
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[400px] rounded-[24px]">
                                        <DialogHeader>
                                            <DialogTitle>Add Farm Employee</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateEmployee} className="space-y-4 mt-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Full Name</label>
                                                <Input required placeholder="e.g. John Doe" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="rounded-xl border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Role</label>
                                                <Select value={newEmp.role} onValueChange={v => setNewEmp({...newEmp, role: v})}>
                                                    <SelectTrigger className="rounded-xl border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Farm Manager">Farm Manager</SelectItem>
                                                        <SelectItem value="Agronomist">Agronomist</SelectItem>
                                                        <SelectItem value="Tractor Driver">Tractor Driver</SelectItem>
                                                        <SelectItem value="Harvester">Harvester</SelectItem>
                                                        <SelectItem value="Farm Hand">Farm Hand</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Phone Number (For SMS)</label>
                                                <Input required placeholder="+254..." value={newEmp.phoneNumber} onChange={e => setNewEmp({...newEmp, phoneNumber: e.target.value})} className="rounded-xl border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Email Address</label>
                                                <Input type="email" placeholder="employee@example.com" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="rounded-xl border-slate-200" />
                                            </div>
                                            <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-6 font-bold mt-2">
                                                Save Employee
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {loading ? (
                                <div className="text-center text-slate-400 py-10">Loading...</div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-slate-500 font-medium text-sm">No employees added yet.</p>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {employees.map(emp => (
                                        <li key={emp.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl group transition-colors">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 text-sm leading-tight">{emp.name}</p>
                                                <p className="text-slate-500 text-xs font-semibold">{emp.role}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                                className="p-2 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Fire Employee"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
