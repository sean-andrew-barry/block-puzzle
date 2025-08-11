import { BoardProvider } from "/src/components/Board/BoardProvider";
import Header from "/src/components/Header";
// import Footer from "/src/components/Footer";
// import CollapsibleRules from "/src/components/CollapsibleRules";
// import CollapsibleStats from "/src/components/CollapsibleStats";
import Board from "/src/components/Board/Board";
import Queue from "/src/components/Queue";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <BoardProvider rows={12} cols={12} gapPx={6} /* seed optional */>
        <Header />
        <main className="flex-1 flex flex-col p-4 lg:p-6 min-h-0">
          <div className="max-w-7xl mx-auto">
            <div className="h-full flex flex-col xl:flex-row gap-4 lg:gap-6">
              <div className="flex-1 min-w-0">
                <Board />
              </div>

              <aside className="w-full xl:w-80 shrink-0">
                <Queue />
              </aside>
            </div>

            {/* Collapsible Stats & Rules */}
            {/* <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CollapsibleRules />
              <CollapsibleStats />
            </div> */}
          </div>
        </main>
        {/* <Footer /> */}
      </BoardProvider>
    </div>
  );
}
