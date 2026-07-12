import ProjectCard from './ProjectCard';

const MOCK_PROJECTS = [
  { id: 1, title: 'SaaS Analytics Dashboard',  description: 'A full-stack analytics dashboard with real-time data visualization.',             techStack: ['React', 'Node.js', 'MongoDB'],           link: null, image: null },
  { id: 2, title: 'E-commerce Website',         description: 'A modern e-commerce platform with product filtering and cart functionality.',     techStack: ['Next.js', 'Tailwind CSS', 'Stripe'],     link: null, image: null },
  { id: 3, title: 'Personal Finance Tracker',   description: 'Track income, expenses and manage budgets with beautiful charts.',                techStack: ['React', 'Chart.js', 'LocalStorage'],     link: null, image: null },
  { id: 4, title: 'AI Chat Application',        description: 'An AI-powered chat application with real-time conversational interface.',         techStack: ['React', 'OpenAI API', 'Tailwind CSS'],   link: null, image: null },
  { id: 5, title: 'Task Management App',        description: 'A collaborative task management app to boost productivity.',                       techStack: ['Vue.js', 'Firebase', 'Tailwind CSS'],    link: null, image: null },
  { id: 6, title: 'Developer Portfolio',        description: 'A personal portfolio to showcase skills, projects and experience.',                techStack: ['HTML', 'CSS', 'JavaScript'],             link: null, image: null },
];

export default function StudentProjects() {
  return (
    <section
      id="projects"
      className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ backgroundImage: 'url(/sticky-notes-projects-section.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      <div className="max-w-6xl mx-auto relative z-10">

        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Student Work / Projects Showcase</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">What Our Students Build</h2>
          <p className="text-[#475569] text-base max-w-md mx-auto">Explore real projects created by our students during their learning journey.</p>
        </div>

        <div data-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PROJECTS.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>

      </div>
    </section>
  );
}
