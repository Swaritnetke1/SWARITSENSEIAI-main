import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { PhantomComparison } from '../../lib/analytics';
import { dbV2 as db, PeerCompetitor } from '../../lib/database-v2';
import { Users, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

interface PhantomModeCardProps {
  comparisons: PhantomComparison[];
  onRefresh: () => void;
}

export function PhantomModeCard({ comparisons, onRefresh }: PhantomModeCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    dailyStudyHours: 8,
    color: '#8b5cf6',
  });

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name) {
      toast.error('Please enter a name');
      return;
    }

    try {
      await db.addCompetitor({
        name: newCompetitor.name,
        dailyStudyHours: newCompetitor.dailyStudyHours,
        color: newCompetitor.color,
        enabled: true,
      });

      toast.success(`${newCompetitor.name} added as competitor!`);
      setNewCompetitor({ name: '', dailyStudyHours: 8, color: '#8b5cf6' });
      setShowAddForm(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to add competitor');
      console.error(error);
    }
  };

  const colorOptions = [
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Peer Phantom Mode</h3>
            <p className="text-sm text-muted-foreground">Compare against hypothetical competitors</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Competitor
          </Button>
        </div>

        {showAddForm && (
          <div className="p-4 bg-background/50 rounded-md space-y-4">
            <div className="space-y-2">
              <Label>Competitor Name</Label>
              <Input
                placeholder="e.g., NEET Topper, IIT Aspirant"
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Daily Study Hours</Label>
              <Input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={newCompetitor.dailyStudyHours}
                onChange={(e) =>
                  setNewCompetitor({
                    ...newCompetitor,
                    dailyStudyHours: parseFloat(e.target.value) || 8,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewCompetitor({ ...newCompetitor, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCompetitor.color === color.value ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddCompetitor} className="flex-1">
                Add Competitor
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {comparisons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No competitors added yet</p>
            <p className="text-sm">Add a competitor to see comparisons</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comparisons.map((comp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-md border border-border/50 bg-background/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: comp.color }}
                    />
                    <div>
                      <p className="font-semibold">{comp.competitorName}</p>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                  <Badge
                    variant={comp.hoursDifference >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {comp.hoursDifference >= 0 ? '+' : ''}
                    {comp.hoursDifference.toFixed(1)}h
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Your Hours</p>
                    <p className="font-bold text-blue-400">{comp.yourTotalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Their Hours</p>
                    <p className="font-bold" style={{ color: comp.color }}>
                      {comp.theirTotalHours.toFixed(1)}h
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Win/Loss</p>
                    <p className="font-bold">
                      <span className="text-green-400">{comp.winningDays}</span>/
                      <span className="text-red-400">{comp.losingDays}</span>
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-md ${
                    comp.hoursDifference >= 0
                      ? 'bg-green-900/20 border border-green-500/30'
                      : 'bg-red-900/20 border border-red-500/30'
                  }`}
                >
                  <p className="text-sm font-semibold">{comp.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
