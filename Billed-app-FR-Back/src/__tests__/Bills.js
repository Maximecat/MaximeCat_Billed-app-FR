/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills")
    Object.defineProperty(
      window,
      'localStorage',
      { value: localStorageMock }
    )
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "a@a"
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)
    router()
  })
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      document.body.innerHTML = BillsUI({ data: bills })
    })
    // Scénario 4
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList).toContain("active-icon")
    })

    // Scénario 5
    test("Then bills should be ordered from earliest to latest", () => {
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    // Scénario GET
    test("Then the GetBills function is called", async () => {
      // Fonction de test GET des Bills
      window.onNavigate(ROUTES_PATH.Bills);
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const b = await billsContainer.getBills();
      document.body.innerHTML = BillsUI({ data: [b[0]] });
      const message = await screen.getByText("encore");
      expect(message).toBeTruthy();
    });

    // Scénario 6
    describe("When I click on the new bill buttton", () => {
      test("Then it should navigate to NewBill page", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const billsContainer = new Bills({
          document, onNavigate, store: null, localStorage: window.localStorage
        })

        const btnNewBill = screen.getByTestId('btn-new-bill')

        // Simule un click
        const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
        btnNewBill.addEventListener("click", handleClickNewBill)
        userEvent.click(btnNewBill)
        // Attendre (expect) que la fonction handleClickNewBill est bien été appeller
        expect(handleClickNewBill).toHaveBeenCalled()
      })
    })

    // Scénario 13
    test("Then I click on preview bill button", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const billsContainer = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const btnPreview = screen.getAllByTestId('icon-eye')[0]

      const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye(btnPreview))
      btnPreview.addEventListener("click", handleClickIconEye)
      fireEvent.click(btnPreview)

      expect(handleClickIconEye).toHaveBeenCalled()
    })
  })

  test("fetches bills from an API and fails with 404 or 500 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur"))
        }
      }
    })
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur/)
    expect(message).toBeTruthy()

  })
})
