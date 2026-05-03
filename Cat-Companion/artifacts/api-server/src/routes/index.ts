import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catsRouter from "./cats";
import feedingsRouter from "./feedings";
import vetAppointmentsRouter from "./vet-appointments";
import weightLogsRouter from "./weight-logs";
import dashboardRouter from "./dashboard";
import milestonesRouter from "./milestones";
import photoAlbumRouter from "./photo-album";
import medicationsRouter from "./medications";
import vetContactsRouter from "./vet-contacts";
import storageRouter from "./storage";
import healthRecordsRouter from "./health-records";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catsRouter);
router.use(feedingsRouter);
router.use(vetAppointmentsRouter);
router.use(weightLogsRouter);
router.use(dashboardRouter);
router.use(milestonesRouter);
router.use(photoAlbumRouter);
router.use(medicationsRouter);
router.use(vetContactsRouter);
router.use(healthRecordsRouter);
router.use(storageRouter);
router.use(usersRouter);

export default router;
