import { Roadmap } from "@/components/dashboard/Roadmap";

export default function RoadmapPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Roadmap & Sugestões</h1>
                    <p className="text-muted-foreground mt-2">
                        Vote nas próximas funcionalidades ou sugira algo novo.
                    </p>
                </div>
            </div>

            <Roadmap />
        </div>
    );
}
