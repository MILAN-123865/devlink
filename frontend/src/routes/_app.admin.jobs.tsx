import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, RefreshCw, Activity, Play, CheckCircle, XCircle, Clock, Cpu, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/api/client";


export const Route = createFileRoute("/_app/admin/jobs")({
  component: () => <div className="p-6">Admin Jobs Page</div>,
});
