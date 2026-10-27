import React, { useState, useEffect } from 'react';
import { 
  Users, Shuffle, Copy, Check, Plus, Minus, ArrowLeftRight, Trash2, 
  Sparkles, Download, Edit2, CheckCircle2, AlertCircle, Maximize2, 
  Minimize2, LayoutGrid, Columns3, ListFilter, UserPlus, Printer, 
  Layers, Search, FileDown, Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export interface GroupMember {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

interface GroupSorterProps {
  names: string[];
  onChangeNames: (newNames: string) => void;
  isSpinning: boolean;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
}

export default function GroupSorter({ 
  names, 
  onChangeNames, 
  isSpinning,
  isFullWidth = false,
  onToggleFullWidth
}: GroupSorterProps) {
  const [numGroups, setNumGroups] = useState<number>(() => {
    const saved = localStorage.getItem('won_groups_count');
    return saved ? parseInt(saved, 10) : 4;
  });
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');
  
  // Layout customization for ultimate flexibility
  const [columnDensity, setColumnDensity] = useState<'auto' | '1' | '2' | '3' | '4'>('auto');
  const [viewMode, setViewMode] = useState<'grid' | 'board' | 'table'>('grid');
  const [autoExpandHeight, setAutoExpandHeight] = useState<boolean>(true); // default true: NEVER cut off!
  
  // Quick student moving state
  const [movingStudent, setMovingStudent] = useState<{ member: GroupMember; fromGroupId: string } | null>(null);

  // Quick add student to specific group
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');

  // Search filter inside groups
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('won_groups_count', numGroups.toString());
  }, [numGroups]);

  // Clean name lists
  const validNames = names.map(n => n.trim()).filter(n => n.length > 0);

  // Total members currently distributed across all groups
  const totalSortedMembers = groups.reduce((acc, g) => acc + g.members.length, 0);

  // Check if there are newly added names in Entries not yet sorted
  const hasUnsortedNames = groups.length > 0 && validNames.length > totalSortedMembers;
  const unsortedDifference = Math.max(0, validNames.length - totalSortedMembers);

  // Distribute names into groups with unique member IDs (prevents React duplicate key bugs)
  const sortIntoGroups = () => {
    if (validNames.length === 0) return;
    setIsSorting(true);

    setTimeout(() => {
      // Shuffle names array
      const shuffled = [...validNames];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Initialize empty groups
      const newGroups: Group[] = Array.from({ length: numGroups }, (_, index) => ({
        id: `group-${index + 1}-${Math.random().toString(36).substring(2, 6)}`,
        name: `Group ${index + 1}`,
        members: []
      }));

      // Distribute names evenly with unique IDs so duplicates render completely
      shuffled.forEach((name, idx) => {
        const groupIdx = idx % numGroups;
        newGroups[groupIdx].members.push({
          id: `member-${idx}-${Math.random().toString(36).substring(2, 8)}`,
          name
        });
      });

      setGroups(newGroups);
      setIsSorting(false);
    }, 500);
  };

  // Distribute only newly added names without resetting existing groupings
  const distributeNewNamesOnly = () => {
    if (groups.length === 0) {
      sortIntoGroups();
      return;
    }

    // Collect all existing names currently in groups
    const currentMemberNames = groups.flatMap(g => g.members.map(m => m.name));
    
    // Identify unassigned names from validNames
    const unassigned: string[] = [];
    const pool = [...validNames];
    
    for (const name of pool) {
      const idx = currentMemberNames.indexOf(name);
      if (idx !== -1) {
        currentMemberNames.splice(idx, 1);
      } else {
        unassigned.push(name);
      }
    }

    if (unassigned.length === 0) return;

    setGroups(prevGroups => {
      const updated = prevGroups.map(g => ({ ...g, members: [...g.members] }));
      unassigned.forEach((name, i) => {
        // Find group with smallest member count
        let smallestGroupIdx = 0;
        let minCount = updated[0]?.members.length || 0;
        for (let gIdx = 1; gIdx < updated.length; gIdx++) {
          if (updated[gIdx].members.length < minCount) {
            minCount = updated[gIdx].members.length;
            smallestGroupIdx = gIdx;
          }
        }
        updated[smallestGroupIdx].members.push({
          id: `member-new-${i}-${Math.random().toString(36).substring(2, 8)}`,
          name
        });
      });
      return updated;
    });
  };

  // Re-sort current groups if any names change, or if a student was moved
  const handleMoveStudent = (memberId: string, fromGroupId: string, toGroupId: string) => {
    setGroups(prevGroups => {
      let movedMember: GroupMember | null = null;
      
      // Remove from source group
      const afterRemoval = prevGroups.map(group => {
        if (group.id === fromGroupId) {
          const found = group.members.find(m => m.id === memberId);
          if (found) movedMember = found;
          return {
            ...group,
            members: group.members.filter(m => m.id !== memberId)
          };
        }
        return group;
      });

      // Add to destination group
      if (movedMember) {
        return afterRemoval.map(group => {
          if (group.id === toGroupId) {
            return {
              ...group,
              members: [...group.members, movedMember!]
            };
          }
          return group;
        });
      }
      return afterRemoval;
    });
    setMovingStudent(null);
  };

  // Delete a student from the active groups & trigger parent list update
  const handleDeleteStudent = (memberId: string, fromGroupId: string) => {
    let deletedName: string | null = null;

    setGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === fromGroupId) {
          const target = group.members.find(m => m.id === memberId);
          if (target) deletedName = target.name;
          return {
            ...group,
            members: group.members.filter(m => m.id !== memberId)
          };
        }
        return group;
      });
    });

    // Remove first match from parent list
    if (deletedName) {
      const currentList = [...validNames];
      const matchIdx = currentList.indexOf(deletedName);
      if (matchIdx !== -1) {
        currentList.splice(matchIdx, 1);
        onChangeNames(currentList.join('\n'));
      }
    }
  };

  // Quick add a student directly to a group
  const handleAddStudentToGroup = (groupId: string) => {
    if (!newStudentName.trim()) return;
    const nameToAdd = newStudentName.trim();

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: [
            ...g.members, 
            { id: `member-add-${Math.random().toString(36).substring(2, 8)}`, name: nameToAdd }
          ]
        };
      }
      return g;
    }));

    // Also append to parent names list
    const updated = [...validNames, nameToAdd];
    onChangeNames(updated.join('\n'));

    setNewStudentName('');
    setAddingToGroupId(null);
  };

  // Copy Group Sorter text output to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;
    
    const textOutput = groups
      .map((group, idx) => {
        const membersList = group.members.length > 0 
          ? group.members.map((m, mIdx) => `  ${mIdx + 1}. ${m.name}`).join('\n')
          : '  (Tiada ahli / Empty)';
        return `KUMPULAN ${idx + 1}: ${group.name} (${group.members.length} orang murid)\n${membersList}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(textOutput)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  // Copy single group
  const handleCopySingleGroup = (group: Group) => {
    const textOutput = `${group.name} (${group.members.length} murid):\n` +
      group.members.map((m, idx) => `${idx + 1}. ${m.name}`).join('\n');
    navigator.clipboard.writeText(textOutput);
  };

  // Print formatted group view
  const handlePrint = () => {
    window.print();
  };

  // Helper to render one group per A4 portrait page
  const renderGroupPage = (
    doc: jsPDF, 
    group: Group, 
    groupIndex: number, 
    totalGroups: number
  ) => {
    const formattedDate = new Date().toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const marginX = 14;
    const usableWidth = 182; // 210mm - (14 * 2)

    // Top Header Banner
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.roundedRect(marginX, 12, usableWidth, 16, 2.5, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SENARAI NAMA MURID MENGIKUT KUMPULAN', marginX + 6, 22.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Tarikh: ${formattedDate}`, marginX + usableWidth - 6, 22.5, { align: 'right' });

    // Group Information Box
    const groupCardY = 32;
    const groupCardHeight = 22;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, groupCardY, usableWidth, groupCardHeight, 3, 3, 'FD');

    // Accent line on left of card
    const accentColors: [number, number, number][] = [
      [37, 99, 235],   // blue
      [16, 185, 129],  // emerald
      [225, 29, 72],   // rose
      [217, 119, 6],   // amber
      [147, 51, 234],  // purple
      [8, 145, 178],   // cyan
      [192, 38, 211],  // fuchsia
      [13, 148, 136]   // teal
    ];
    const accent = accentColors[groupIndex % accentColors.length];
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(marginX, groupCardY, 4, groupCardHeight, 2, 2, 'F');

    // Group Title text
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const groupTitle = (group.name || `KUMPULAN ${groupIndex + 1}`).toUpperCase();
    doc.text(groupTitle, marginX + 9, groupCardY + 9.5);

    // Group Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Kumpulan #${groupIndex + 1} daripada ${totalGroups} kumpulan  •  Jumlah Keseluruhan: ${group.members.length} Murid`, marginX + 9, groupCardY + 16.5);

    // Pill badge on the right
    const badgeWidth = 44;
    const badgeHeight = 12;
    const badgeX = marginX + usableWidth - badgeWidth - 5;
    const badgeY = groupCardY + 5;
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');
    doc.setTextColor(29, 78, 216); // blue-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${group.members.length} ORANG MURID`, badgeX + (badgeWidth / 2), badgeY + 8, { align: 'center' });

    // Table Content
    const tableStartY = 58;
    const membersCount = group.members.length;

    if (membersCount === 0) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, tableStartY, usableWidth, 40, 3, 3, 'FD');
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('(Tiada murid dalam kumpulan ini)', marginX + (usableWidth / 2), tableStartY + 22, { align: 'center' });
    } else if (membersCount <= 16) {
      // SINGLE-COLUMN TABLE (Generous spacing, perfectly fitted on 1 A4 portrait page)
      const colBilWidth = 16;
      const colCatatanWidth = 46;
      const colNamaWidth = usableWidth - colBilWidth - colCatatanWidth;

      // Header row
      const headerHeight = 9;
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(marginX, tableStartY, usableWidth, headerHeight, 'FD');

      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('BIL', marginX + (colBilWidth / 2), tableStartY + 6, { align: 'center' });
      doc.text('NAMA PENUH MURID', marginX + colBilWidth + 5, tableStartY + 6);
      doc.text('CATATAN / KEHADIRAN', marginX + colBilWidth + colNamaWidth + (colCatatanWidth / 2), tableStartY + 6, { align: 'center' });

      // Rows
      const availableTableHeight = 212;
      const rowHeight = Math.min(12, Math.max(8.5, availableTableHeight / Math.max(membersCount, 12)));

      group.members.forEach((member, mIdx) => {
        const rowY = tableStartY + headerHeight + (mIdx * rowHeight);
        
        // Alternating background
        if (mIdx % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(marginX, rowY, usableWidth, rowHeight, 'FD');

        // Column dividers
        doc.line(marginX + colBilWidth, rowY, marginX + colBilWidth, rowY + rowHeight);
        doc.line(marginX + colBilWidth + colNamaWidth, rowY, marginX + colBilWidth + colNamaWidth, rowY + rowHeight);

        // Number
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(String(mIdx + 1), marginX + (colBilWidth / 2), rowY + (rowHeight / 2) + 2.5, { align: 'center' });

        // Pupil Name
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const safeName = doc.splitTextToSize(member.name, colNamaWidth - 8)[0] || member.name;
        doc.text(safeName, marginX + colBilWidth + 5, rowY + (rowHeight / 2) + 2.5);

        // Checkbox square in Catatan column
        const boxSize = 4.2;
        const boxX = marginX + colBilWidth + colNamaWidth + 10;
        const boxY = rowY + (rowHeight / 2) - (boxSize / 2);
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.rect(boxX, boxY, boxSize, boxSize);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Hadir', boxX + boxSize + 3, rowY + (rowHeight / 2) + 2.5);
      });
    } else {
      // TWO-COLUMN COMPACT TABLE (Supports up to 45 students on 1 single A4 portrait page)
      const halfCount = Math.ceil(membersCount / 2);
      const colWidth = 88;
      const gap = 6;
      const leftColX = marginX;
      const rightColX = marginX + colWidth + gap;

      const subBilWidth = 12;
      const subCheckWidth = 18;
      const subNameWidth = colWidth - subBilWidth - subCheckWidth;

      const availableTableHeight = 214;
      const rowHeight = Math.min(9.5, Math.max(7.0, availableTableHeight / (halfCount + 1)));

      const drawSubHeader = (startX: number) => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(startX, tableStartY, colWidth, rowHeight, 'FD');

        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('BIL', startX + (subBilWidth / 2), tableStartY + (rowHeight / 2) + 2.2, { align: 'center' });
        doc.text('NAMA MURID', startX + subBilWidth + 3, tableStartY + (rowHeight / 2) + 2.2);
        doc.text('SEMAKAN', startX + subBilWidth + subNameWidth + (subCheckWidth / 2), tableStartY + (rowHeight / 2) + 2.2, { align: 'center' });
      };

      drawSubHeader(leftColX);
      drawSubHeader(rightColX);

      group.members.forEach((member, mIdx) => {
        const isRightColumn = mIdx >= halfCount;
        const startX = isRightColumn ? rightColX : leftColX;
        const rowIndex = isRightColumn ? mIdx - halfCount : mIdx;
        const rowY = tableStartY + rowHeight + (rowIndex * rowHeight);

        // Alternating fill
        if (rowIndex % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(startX, rowY, colWidth, rowHeight, 'FD');

        // Column lines
        doc.line(startX + subBilWidth, rowY, startX + subBilWidth, rowY + rowHeight);
        doc.line(startX + subBilWidth + subNameWidth, rowY, startX + subBilWidth + subNameWidth, rowY + rowHeight);

        // Bil
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(String(mIdx + 1), startX + (subBilWidth / 2), rowY + (rowHeight / 2) + 2.2, { align: 'center' });

        // Name
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const safeName = doc.splitTextToSize(member.name, subNameWidth - 4)[0] || member.name;
        doc.text(safeName, startX + subBilWidth + 3, rowY + (rowHeight / 2) + 2.2);

        // Checkbox
        const boxSize = 3.6;
        const boxX = startX + subBilWidth + subNameWidth + (subCheckWidth / 2) - (boxSize / 2);
        const boxY = rowY + (rowHeight / 2) - (boxSize / 2);
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.rect(boxX, boxY, boxSize, boxSize);
      });
    }

    // Bottom Page Footer (Strictly at bottom of A4)
    const footerY = 281;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, footerY, marginX + usableWidth, footerY);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Susunan Kumpulan Murid  •  Format Cetakan Rasmi', marginX, footerY + 5.5);

    doc.setFont('helvetica', 'italic');
    doc.text('1 Kumpulan 1 Muka Surat (A4 Potret)', marginX + (usableWidth / 2), footerY + 5.5, { align: 'center' });

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('helvetica', 'bold');
    doc.text(`Muka Surat ${groupIndex + 1} daripada ${totalGroups}`, marginX + usableWidth, footerY + 5.5, { align: 'right' });
  };

  // Download ALL groups into 1 single PDF (strictly 1 group per page, A4 portrait)
  const handleDownloadAllGroupsPdf = () => {
    if (groups.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      // 1 kumpulan wajib 1 muka surat saiz a4 Dan POTRAIT. Pastikan semua kumpulan ada dalam 1 pdf itu
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      groups.forEach((group, index) => {
        if (index > 0) {
          doc.addPage('a4', 'portrait');
        }
        renderGroupPage(doc, group, index, groups.length);
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`Susunan_Kumpulan_Murid_${groups.length}_Kumpulan_${timestamp}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download single group as A4 portrait PDF
  const handleDownloadSingleGroupPdf = (group: Group, groupIndex: number) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      renderGroupPage(doc, group, groupIndex, groups.length);
      const safeName = group.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`${safeName}_A4_Potret.pdf`);
    } catch (err) {
      console.error('Error generating single group PDF:', err);
    }
  };

  // Inline rename group
  const startRenameGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setTempGroupName(group.name);
  };

  const saveGroupName = (groupId: string) => {
    if (tempGroupName.trim() === '') {
      setEditingGroupId(null);
      return;
    }
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: tempGroupName.trim() } : g));
    setEditingGroupId(null);
  };

  const handleGroupNameKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter') {
      saveGroupName(groupId);
    } else if (e.key === 'Escape') {
      setEditingGroupId(null);
    }
  };

  // Preset Colors for Group Headings for visual clarity
  const groupColors = [
    'from-blue-600 to-indigo-600 border-blue-500',
    'from-emerald-600 to-teal-600 border-emerald-500',
    'from-rose-600 to-pink-600 border-rose-500',
    'from-amber-600 to-orange-600 border-amber-500',
    'from-purple-600 to-violet-600 border-purple-500',
    'from-cyan-600 to-blue-600 border-cyan-500',
    'from-fuchsia-600 to-pink-600 border-fuchsia-500',
    'from-teal-600 to-emerald-600 border-teal-500'
  ];

  // Dynamic grid column class based on density setting
  const getGridColsClass = () => {
    if (columnDensity === '1') return 'grid-cols-1';
    if (columnDensity === '2') return 'grid-cols-1 sm:grid-cols-2';
    if (columnDensity === '3') return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (columnDensity === '4') return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    // Auto responsive density:
    if (isFullWidth) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
    }
    return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
  };

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto pr-0.5" id="group-sorter-container">
      {/* Sorter Controls Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col gap-3 shrink-0">
        
        {/* Top Control Bar: Group Counts, Status, & Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Target Group Selector */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-sm font-extrabold text-slate-800">Bilangan Kumpulan:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setNumGroups(prev => Math.max(2, prev - 1))}
                className="p-1.5 hover:bg-white active:scale-95 text-slate-600 rounded-lg transition-all cursor-pointer"
                title="Kurangkan kumpulan"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={2}
                max={50}
                value={numGroups}
                onChange={(e) => setNumGroups(Math.max(2, Math.min(50, parseInt(e.target.value, 10) || 2)))}
                className="w-12 text-center font-black text-slate-800 bg-transparent outline-none text-sm"
              />
              <button
                onClick={() => setNumGroups(prev => Math.min(50, prev + 1))}
                className="p-1.5 hover:bg-white active:scale-95 text-slate-600 rounded-lg transition-all cursor-pointer"
                title="Tambah kumpulan"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stats indicator */}
            <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg">
              {validNames.length} murid · ~{Math.ceil(validNames.length / numGroups)} murid/kumpulan
            </div>
          </div>

          {/* Action Buttons: Sort, Copy, Full Width */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {onToggleFullWidth && (
              <button
                onClick={onToggleFullWidth}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isFullWidth 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title={isFullWidth ? "Tutup paparan penuh" : "Buka paparan lebar penuh untuk ruang lebih luas"}
              >
                {isFullWidth ? <Minimize2 className="w-3.5 h-3.5 text-blue-600" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isFullWidth ? 'Standard View' : 'Lebar Penuh'}</span>
              </button>
            )}

            {groups.length > 0 && (
              <>
                <button
                  onClick={handleDownloadAllGroupsPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs shadow-emerald-600/20 disabled:opacity-50"
                  title="Muat turun SEMUA kumpulan ke dalam 1 fail PDF (1 kumpulan 1 muka surat A4 Potret)"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingPdf ? 'Menjana PDF...' : 'Muat Turun PDF'}</span>
                </button>

                <button
                  onClick={handleCopyGroups}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                  title="Salin senarai semua kumpulan"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Semua'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                  title="Cetak senarai kumpulan"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak</span>
                </button>
              </>
            )}

            <button
              onClick={sortIntoGroups}
              disabled={validNames.length === 0 || isSorting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Shuffle className={`w-4 h-4 ${isSorting ? 'animate-spin' : ''}`} />
              <span>{groups.length > 0 ? 'Susun Semula' : 'Susun Kumpulan'}</span>
            </button>
          </div>
        </div>

        {/* Display Flexibility Toolbar: Columns, Views, Auto-height */}
        {groups.length > 0 && !isSorting && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Left: View Mode & Density */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Kolum Density */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">Kolum:</span>
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  {(['auto', '1', '2', '3', '4'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => setColumnDensity(density)}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        columnDensity === density 
                          ? 'bg-white text-blue-600 shadow-2xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title={density === '1' ? '1 Kolum (Lebar penuh)' : `${density} Kolum`}
                    >
                      {density === 'auto' ? 'Auto' : `${density} Kolum`}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">Paparan:</span>
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Kad</span>
                  </button>
                  <button
                    onClick={() => setViewMode('board')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      viewMode === 'board' 
                        ? 'bg-white text-blue-600 shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Columns3 className="w-3 h-3" />
                    <span>Papan Kolum</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      viewMode === 'table' 
                        ? 'bg-white text-blue-600 shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListFilter className="w-3 h-3" />
                    <span>Senarai</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Height & Search options */}
            <div className="flex items-center gap-3">
              {/* Auto Expand Height Toggle (ensures nothing is ever cut off!) */}
              <button
                onClick={() => setAutoExpandHeight(!autoExpandHeight)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  autoExpandHeight 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
                title="Tunjuk semua murid tanpa kotak skrol terhad"
              >
                <CheckCircle2 className={`w-3 h-3 ${autoExpandHeight ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{autoExpandHeight ? 'Kotak Fleksibel (Tunjuk Semua)' : 'Kotak Berskrol'}</span>
              </button>

              {/* Quick Search in groups */}
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari murid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-400 text-slate-700 w-28 sm:w-36"
                />
              </div>
            </div>
          </div>
        )}

        {/* Verification Status Banner: Confirms ALL students are accounted for */}
        {groups.length > 0 && !isSorting && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-extrabold text-emerald-900">
                Semua {totalSortedMembers} murid telah dipaparkan sepenuhnya dalam {groups.length} kumpulan.
              </span>
              <span className="text-emerald-700 font-semibold hidden md:inline">
                (Tiada nama tertinggal atau terpotong)
              </span>
            </div>

            <span className="text-[11px] font-black text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
              {totalSortedMembers} / {validNames.length} murid
            </span>
          </div>
        )}

        {/* Warning Banner if user added new names in Entries that are not yet sorted */}
        {hasUnsortedNames && !isSorting && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">
                Terdapat {unsortedDifference} murid baharu dalam senarai yang belum diagihkan ke dalam kumpulan.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={distributeNewNamesOnly}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer"
              >
                Agihkan Murid Baharu
              </button>
              <button
                onClick={sortIntoGroups}
                className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
              >
                Susun Semula Semua
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sorting Animation State */}
      {isSorting && (
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-3 py-16 animate-pulse bg-white rounded-3xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
          <h3 className="text-sm font-black text-slate-800 tracking-tight">Menyusun murid ke kumpulan...</h3>
          <p className="text-xs text-slate-400">Mengagihkan semua nama secara rawak dan seimbang</p>
        </div>
      )}

      {/* Empty State */}
      {!isSorting && groups.length === 0 && (
        <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Belum Ada Kumpulan Yang Disusun</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
            Pilih bilangan kumpulan yang diinginkan, pastikan nama murid telah diisi pada senarai sebelah kanan, kemudian klik butang <strong className="text-blue-600 font-bold">Susun Kumpulan</strong>!
          </p>
        </div>
      )}

      {/* VIEW MODE 1: GRID VIEW (KAD FLEKSIBEL) */}
      {!isSorting && groups.length > 0 && viewMode === 'grid' && (
        <div 
          className={`grid ${getGridColsClass()} gap-5 flex-1 ${
            autoExpandHeight ? 'h-auto overflow-visible' : 'overflow-y-auto max-h-[650px] pr-1'
          }`}
        >
          {groups.map((group, groupIdx) => {
            const headingGradient = groupColors[groupIdx % groupColors.length];
            const filteredMembers = searchQuery 
              ? group.members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
              : group.members;

            return (
              <div 
                key={group.id} 
                className="bg-white border-2 border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-blue-200 group/card w-full"
              >
                {/* Group Card Header */}
                <div className={`p-3.5 bg-gradient-to-r ${headingGradient} text-white flex items-center justify-between gap-2 shadow-xs`}>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {editingGroupId === group.id ? (
                      <input
                        type="text"
                        value={tempGroupName}
                        onChange={(e) => setTempGroupName(e.target.value)}
                        onBlur={() => saveGroupName(group.id)}
                        onKeyDown={(e) => handleGroupNameKeyDown(e, group.id)}
                        autoFocus
                        className="bg-white/25 border border-white/40 focus:ring-1 focus:ring-white rounded px-2 py-0.5 text-sm font-extrabold text-white outline-none w-full"
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-1.5 group/title cursor-pointer flex-1 min-w-0" 
                        onClick={() => startRenameGroup(group)}
                        title="Klik untuk ubah nama kumpulan"
                      >
                        <h4 className="text-sm font-black tracking-tight break-words whitespace-normal leading-snug">
                          {group.name}
                        </h4>
                        <Edit2 className="w-3.5 h-3.5 opacity-60 group-hover/title:opacity-100 transition-opacity shrink-0" />
                      </div>
                    )}
                  </div>
                  
                  {/* Card Header Actions & Counter */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDownloadSingleGroupPdf(group, groupIdx)}
                      className="p-1 hover:bg-white/20 rounded-md text-white transition-colors cursor-pointer"
                      title="Muat turun PDF untuk kumpulan ini (1 muka surat A4 Potret)"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopySingleGroup(group)}
                      className="p-1 hover:bg-white/20 rounded-md text-white transition-colors cursor-pointer"
                      title="Salin kumpulan ini sahaja"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-black tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-white whitespace-nowrap shadow-2xs">
                      {group.members.length} murid
                    </span>
                  </div>
                </div>

                {/* Group Card Body / Member list (FLEXIBLE HEIGHT, NEVER TRUNCATE) */}
                <div className="p-3.5 flex-1 flex flex-col justify-start bg-slate-50/50 min-h-[140px] gap-3">
                  
                  {group.members.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-xs text-slate-400 italic">
                      Tiada ahli dalam kumpulan ini
                    </div>
                  ) : (
                    <ul className="space-y-2 flex-1">
                      {filteredMembers.map((member, memberIdx) => (
                        <li 
                          key={member.id}
                          className="flex items-center justify-between p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl shadow-2xs group/member transition-all hover:border-blue-300 hover:shadow-xs"
                        >
                          {/* Pupil Number & Full Name (Full wrapping, flex-1, break-words) */}
                          <div className="flex items-start gap-2.5 flex-1 min-w-0 mr-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 select-none">
                              {memberIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 break-words whitespace-normal leading-relaxed flex-1 min-w-0">
                              {member.name}
                            </span>
                          </div>
                          
                          {/* Student manual swap & remove actions */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover/member:opacity-100 transition-opacity">
                            <button
                              onClick={() => setMovingStudent({ member, fromGroupId: group.id })}
                              className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                              title={`Pindah ${member.name} ke kumpulan lain`}
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(member.id, group.id)}
                              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                              title={`Padam ${member.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Inline Quick Add Pupil to this specific group */}
                  {addingToGroupId === group.id ? (
                    <div className="mt-1 pt-2 border-t border-slate-200/80 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Nama murid baru..."
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddStudentToGroup(group.id);
                          if (e.key === 'Escape') setAddingToGroupId(null);
                        }}
                        autoFocus
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-blue-400 rounded-lg outline-none font-semibold text-slate-800"
                      />
                      <button
                        onClick={() => handleAddStudentToGroup(group.id)}
                        className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                      >
                        Tambah
                      </button>
                      <button
                        onClick={() => setAddingToGroupId(null)}
                        className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingToGroupId(group.id);
                        setNewStudentName('');
                      }}
                      className="mt-1 py-1.5 px-3 border border-dashed border-slate-200 hover:border-blue-300 hover:bg-white text-slate-400 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Murid</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: BOARD / HORIZONTAL COLUMNS VIEW */}
      {!isSorting && groups.length > 0 && viewMode === 'board' && (
        <div className="w-full overflow-x-auto pb-4 pt-1 flex gap-4 scrollbar-thin">
          {groups.map((group, groupIdx) => {
            const headingGradient = groupColors[groupIdx % groupColors.length];
            const filteredMembers = searchQuery 
              ? group.members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
              : group.members;

            return (
              <div 
                key={group.id} 
                className="w-72 sm:w-80 shrink-0 bg-white border-2 border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className={`p-3.5 bg-gradient-to-r ${headingGradient} text-white flex items-center justify-between gap-2`}>
                  <h4 className="text-sm font-black tracking-tight truncate flex-1 min-w-0">{group.name}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownloadSingleGroupPdf(group, groupIdx)}
                      className="p-1 hover:bg-white/20 rounded-md text-white transition-colors cursor-pointer"
                      title="Muat turun PDF kumpulan ini (1 muka surat A4 Potret)"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopySingleGroup(group)}
                      className="p-1 hover:bg-white/20 rounded-md text-white transition-colors cursor-pointer"
                      title="Salin kumpulan ini sahaja"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-black bg-white/20 px-2 py-0.5 rounded text-white shadow-2xs">
                      {group.members.length} murid
                    </span>
                  </div>
                </div>

                {/* Members list */}
                <div className="p-3 bg-slate-50 flex-1 flex flex-col gap-2 min-h-[220px]">
                  {filteredMembers.map((member, memberIdx) => (
                    <div 
                      key={member.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {memberIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 break-words whitespace-normal flex-1 min-w-0">
                          {member.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setMovingStudent({ member, fromGroupId: group.id })}
                          className="p-1 text-slate-400 hover:text-blue-600"
                          title="Pindah"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: TABLE / SUMMARY LIST VIEW */}
      {!isSorting && groups.length > 0 && viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-black text-slate-700">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-44">Kumpulan</th>
                <th className="py-3 px-4 w-28 text-center">Jumlah Murid</th>
                <th className="py-3 px-4">Senarai Murid</th>
                <th className="py-3 px-4 w-28 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {groups.map((group, groupIdx) => (
                <tr key={group.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-400 text-center">{groupIdx + 1}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-800">{group.name}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 text-center">{group.members.length} murid</td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex flex-wrap gap-1.5">
                      {group.members.map((m, mIdx) => (
                        <span 
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                        >
                          <span className="text-[10px] text-slate-400">{mIdx + 1}.</span>
                          <span>{m.name}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleDownloadSingleGroupPdf(group, groupIdx)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                        title="Muat turun PDF kumpulan ini (A4 Potret)"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleCopySingleGroup(group)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Salin nama murid kumpulan ini"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Move Student Dialog Modal Backdrop */}
      {movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl">
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-1.5">
              <ArrowLeftRight className="w-4 h-4 text-blue-600" />
              <span>Pindah Murid</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Pilih kumpulan destinasi untuk <strong className="text-slate-800 font-extrabold">{movingStudent.member.name}</strong>:
            </p>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {groups
                .filter(g => g.id !== movingStudent.fromGroupId)
                .map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleMoveStudent(movingStudent.member.id, movingStudent.fromGroupId, group.id)}
                    className="w-full text-left text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 px-3.5 py-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{group.name}</span>
                    <span className="text-[11px] text-slate-400 font-semibold">({group.members.length} murid)</span>
                  </button>
                ))}
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setMovingStudent(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
