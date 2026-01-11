import { useState } from "react";
import { useAuth } from "@/context/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Loader2, 
  Wallet, 
  ChevronDown, 
  ChevronUp,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useTrainerPaymentData, TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrainerEarnings() {
  const { trainerProfile, isTrainer } = useAuth();
  const { currentBranch } = useBranch();
  const { 
    selectedYear, 
    setSelectedYear, 
    selectedTermNumber, 
    setSelectedTermNumber,
    termData,
    years,
    terms
  } = useTerm();
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const { data: trainersData = [], isLoading } = useTrainerPaymentData(currentBranch?.id);

  // Find the current trainer's data
  const trainerData = trainersData.find(t => t.id === trainerProfile?.id);

  const toggleClass = (scheduleId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (trainerData?.classDetails) {
      setExpandedClasses(new Set(trainerData.classDetails.map(c => c.scheduleId)));
    }
  };

  const collapseAll = () => {
    setExpandedClasses(new Set());
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const getStatusColor = (isPaid: boolean) => {
    return isPaid 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200';
  };

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalEarned = trainerData?.totalEarned || 0;
  const totalPending = trainerData?.pending || 0;
  const potentialEarnings = trainerData?.potentialEarnings || 0;
  const classesCount = trainerData?.classesCount || 0;

  // Sort classes by date (most recent first)
  const sortedClasses = trainerData?.classDetails
    ? [...trainerData.classDetails].sort((a, b) => 
        new Date(b.scheduleDate).getTime() - new Date(a.scheduleDate).getTime()
      )
    : [];

  return (
    <DashboardLayout>
      <Helmet>
        <title>My Earnings - Trainer Portal</title>
      </Helmet>

      <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 px-2 sm:px-0">
        {/* Header with Term Selector for Mobile */}
        <div className="space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">My Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your payments and earnings breakdown</p>
          </div>
          
          {/* Mobile Term Selector */}
          <Card className="sm:hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {termData ? `Term ${termData.term_number}, ${selectedYear}` : 'Select Term'}
                </span>
                {termData?.current && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Current</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedTermNumber}
                  onValueChange={(value) => {
                    if (value === '1' || value === '2' || value === '3' || value === '4') {
                      setSelectedTermNumber(value);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term} value={term}>
                        Term {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Earned</CardTitle>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {formatCurrency(totalEarned)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Paid</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-amber-600">
                    {formatCurrency(totalPending)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Awaiting payment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Potential</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {formatCurrency(potentialEarnings)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">If all pay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Classes</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {classesCount}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">This term</p>
                </CardContent>
              </Card>
            </div>

            {/* Class Breakdown */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">Class Breakdown</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={expandAll} className="text-xs">
                      Expand All
                    </Button>
                    <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs">
                      Collapse All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                {sortedClasses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No class data available for this term.
                  </p>
                ) : (
                  sortedClasses.map((classDetail) => (
                    <ClassCard
                      key={classDetail.scheduleId}
                      classDetail={classDetail}
                      isExpanded={expandedClasses.has(classDetail.scheduleId)}
                      onToggle={() => toggleClass(classDetail.scheduleId)}
                      formatCurrency={formatCurrency}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

interface ClassCardProps {
  classDetail: TrainerClassDetail;
  isExpanded: boolean;
  onToggle: () => void;
  formatCurrency: (amount: number) => string;
  getStatusColor: (isPaid: boolean) => string;
}

function ClassCard({ classDetail, isExpanded, onToggle, formatCurrency, getStatusColor }: ClassCardProps) {
  const hasHandlers = classDetail.bookingsDetails && classDetail.bookingsDetails.length > 0;
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Class Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {classDetail.isPaid ? (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-medium text-sm sm:text-base truncate">{classDetail.className}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{classDetail.classDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {classDetail.bookings} handlers
              </Badge>
              <Badge className={`text-xs ${getStatusColor(classDetail.isPaid)}`}>
                {classDetail.isPaid ? 'Paid' : 'Pending'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right">
            <div className="font-bold text-sm sm:text-base text-green-600">
              {formatCurrency(classDetail.revenue)}
            </div>
            {classDetail.potentialRevenue > classDetail.revenue && (
              <div className="text-xs text-muted-foreground">
                / {formatCurrency(classDetail.potentialRevenue)}
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded Handler Details */}
      {isExpanded && hasHandlers && (
        <div className="border-t">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="text-xs">Handler</TableHead>
                  <TableHead className="text-xs">Dog</TableHead>
                  <TableHead className="text-xs text-right">Course Fee</TableHead>
                  <TableHead className="text-xs text-right">Your Commission</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classDetail.bookingsDetails.map((handler, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{handler.handlerName}</div>
                        {handler.handlerEmail && (
                          <div className="text-xs text-muted-foreground">{handler.handlerEmail}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{handler.dogName || 'N/A'}</div>
                        {handler.dogBreed && (
                          <div className="text-xs text-muted-foreground">{handler.dogBreed}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(handler.courseFee || 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm text-green-600">
                      {formatCurrency(handler.commissionAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          handler.paymentStatus === 'paid' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {handler.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell colSpan={2} className="text-sm">Class Total</TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(
                      classDetail.bookingsDetails.reduce((sum, h) => sum + (h.courseFee || 0), 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-600">
                    {formatCurrency(
                      classDetail.bookingsDetails.reduce((sum, h) => sum + h.commissionAmount, 0)
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="sm:hidden divide-y">
            {classDetail.bookingsDetails.map((handler, idx) => (
              <div key={idx} className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{handler.handlerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {handler.dogName || 'No dog'} {handler.dogBreed && `• ${handler.dogBreed}`}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      handler.paymentStatus === 'paid' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {handler.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Course Fee</span>
                  <span>{formatCurrency(handler.courseFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Your Commission</span>
                  <span className="font-bold text-green-600">{formatCurrency(handler.commissionAmount)}</span>
                </div>
              </div>
            ))}
            {/* Mobile Totals */}
            <div className="p-3 bg-muted/30">
              <div className="flex justify-between text-sm font-medium">
                <span>Class Total Commission</span>
                <span className="text-green-600">
                  {formatCurrency(
                    classDetail.bookingsDetails.reduce((sum, h) => sum + h.commissionAmount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No handlers message */}
      {isExpanded && !hasHandlers && (
        <div className="p-4 text-center text-sm text-muted-foreground border-t">
          No handler details available for this class.
        </div>
      )}
    </div>
  );
}
