import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { SlotType } from "../admin/slot-admin-calendar";

interface SlotConfigPanelProps {
  slotConfig: {
    interview: {
      startHour: number;
      endHour: number;
      duration: number;
      quantity: number;
    };
    dynamic: {
      startHour: number;
      endHour: number;
      duration: number;
      quantity: number;
    };
  };
  setSlotConfig: (config: any) => void;
  slotType: string;
  setSlotType: Dispatch<SetStateAction<SlotType>>;
  handleSaveSlots: () => void;
  showConfig?: boolean;
}

export default function SlotConfigPanel({
  showConfig = true,
  slotConfig,
  setSlotConfig,
  slotType,
  setSlotType,
  handleSaveSlots,
}: SlotConfigPanelProps) {
  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {showConfig && (
            <>
              <div>
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={slotConfig[slotType]?.duration}
                  onChange={(e) =>
                    setSlotConfig((prev) => ({
                      ...prev,
                      [slotType]: {
                        ...prev[slotType],
                        duration: Number.parseInt(e.target.value) || 30,
                      },
                    }))
                  }
                  min="15"
                  max="120"
                  step="15"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={slotConfig[slotType]?.quantity}
                  onChange={(e) =>
                    setSlotConfig((prev) => ({
                      ...prev,
                      [slotType]: {
                        ...prev[slotType],
                        quantity: Number.parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={slotType}
                  onValueChange={(value: any) => setSlotType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex items-end gap-2">
            <Button onClick={handleSaveSlots} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>

        {showConfig && (
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Dynamic</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
